import { mirrorSources, apiMirrorSources } from "@/mirrorSources";

const mirrorCache = new Map<string, { mirror: string; expiresAt: number }>();
const MIRROR_CACHE_TTL = 5 * 60 * 1000;

/** Return the origin URL when no verified mirror is available. */
export function throughMirror(mirror: string, targetUrl: string): string {
    if (!mirror) return targetUrl;
    return `${mirror.replace(/\/+$/, "")}/${targetUrl.replace(/^https?:\/\//, "")}`;
}

async function testMirror(url: string) {
    let controller: AbortController | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        controller = new AbortController();
        timeout = setTimeout(() => controller?.abort(), 2000);
        // 使用Date.now()代替performance.now()以提高兼容性
        const start = Date.now();

        // 使用简单的GET请求测试镜像可用性，只获取前几个字节
        const response = await fetch(url, {
            method: "GET", 
            signal: controller.signal,
            headers: { "Range": "bytes=0-100" },
            redirect: "follow",
            cache: "no-store",
        });

        const contentType = response.headers.get("content-type")?.toLowerCase() || "";
        if (!response.ok && response.status !== 206) return Infinity;
        if (contentType.includes("text/html")) return Infinity;
        return Date.now() - start;
    } catch {
        return Infinity; // 超时或错误，算作最慢
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

function getMirrorCandidates(targetUrl: string, isApiUrl: boolean): string[] {
    const sources = isApiUrl ? apiMirrorSources : mirrorSources;
    const candidates = sources.map((mirror) => throughMirror(mirror, targetUrl));

    // jsDelivr 只适用于 GitHub 仓库文件，不适用于 release 或 API。
    if (!isApiUrl && targetUrl.startsWith("https://raw.githubusercontent.com/")) {
        const rawPath = targetUrl.slice("https://raw.githubusercontent.com/".length);
        const [owner, repo, branch, ...fileParts] = rawPath.split("/");
        if (owner && repo && branch && fileParts.length > 0) {
            const filePath = fileParts.join("/");
            candidates.push(
                `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filePath}`,
                `https://fastly.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filePath}`,
            );
        }
    }

    return [...new Set(candidates)];
}

/**
 * 获取最快的普通资源镜像前缀
 */
export async function pickFastestMirror(): Promise<string> {
    const tests = await Promise.all(
        mirrorSources.map(async (url) => ({ url, time: await testMirror(url) }))
    );
    tests.sort((a, b) => a.time - b.time);
    return tests[0].url;
}

/**
 * 获取最快的 GitHub API 镜像前缀
 */
export async function pickFastestApiMirror(): Promise<string> {
    const tests = await Promise.all(
        apiMirrorSources.map(async (url) => ({ url, time: await testMirror(url) }))
    );
    tests.sort((a, b) => a.time - b.time);
    return tests[0].url;
}

/**
 * 根据 URL 自动选择是否使用普通镜像或 API 镜像
 * @param url 原始URL
 * @param noMirror 如果为true，跳过镜像选择
 * @returns 可直接访问的镜像 URL；没有可用镜像时返回空字符串
 */
export async function pickMirrorFor(url: string, noMirror: boolean = false): Promise<string> {
    if (noMirror) {
        return "";
    }
    
    const isApiUrl = url.includes("api.github.com");
    // 镜像对 raw、blob、release 等路径的支持并不一致，不能把一个目标的
    // 检测结果缓存给所有资源。按完整目标 URL 缓存短时间结果。
    const cacheKey = `${isApiUrl ? "api" : "resource"}:${url}`;
    const cached = mirrorCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.mirror;
    }

    // 并行探测，第一个返回有效资源的候选立即获胜。
    const candidates = getMirrorCandidates(url, isApiUrl);
    const mirror = await Promise.any(
        candidates.map(async (candidate) => {
            const time = await testMirror(candidate);
            if (!Number.isFinite(time)) throw new Error("Mirror unavailable");
            return candidate;
        }),
    ).catch(() => "");

    // 全部不可用时返回空字符串，由调用方回退到源站。
    mirrorCache.set(cacheKey, { mirror, expiresAt: Date.now() + MIRROR_CACHE_TTL });
    return mirror;
}
