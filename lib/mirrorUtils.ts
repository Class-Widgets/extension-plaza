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
        });

        // A fast error page is not a usable mirror.
        if (!response.ok && response.status !== 206) return Infinity;
        return Date.now() - start;
    } catch {
        return Infinity; // 超时或错误，算作最慢
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

/**
 * 获取最快的普通资源镜像
 */
export async function pickFastestMirror(): Promise<string> {
    const tests = await Promise.all(
        mirrorSources.map(async (url) => ({ url, time: await testMirror(url) }))
    );
    tests.sort((a, b) => a.time - b.time);
    return tests[0].url;
}

/**
 * 获取最快的 GitHub API 镜像
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
 * @param noMirror 如果为true，直接返回原始URL，跳过镜像选择
 */
export async function pickMirrorFor(url: string, noMirror: boolean = false): Promise<string> {
    // 如果noMirror为true，直接返回原始URL
    if (noMirror) {
        return url;
    }
    
    const isApiUrl = url.includes("api.github.com");
    // 镜像对 raw、blob、release 等路径的支持并不一致，不能把一个目标的
    // 检测结果缓存给所有资源。按完整目标 URL 缓存短时间结果。
    const cacheKey = `${isApiUrl ? "api" : "resource"}:${url}`;
    const cached = mirrorCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.mirror;
    }

    // 根据URL类型选择镜像源
    const sources = isApiUrl ? apiMirrorSources : mirrorSources;
    
    // 使用当前实际目标检测，避免把已经失效或只支持部分路径的镜像选出来。
    const tests = await Promise.all(
        sources.map(async (mirror) => {
            const fullTestUrl = throughMirror(mirror, url);
            try {
                const time = await testMirror(fullTestUrl);
                return { mirror, time };
            } catch {
                return { mirror, time: Infinity };
            }
        })
    );
    
    // 按响应时间排序
    tests.sort((a, b) => a.time - b.time);
    
    // 返回最快的镜像源
    const fastest = tests[0];
    // If every mirror is unavailable, use the source URL instead of building
    // a redirect through an unverified proxy.
    const mirror = fastest && Number.isFinite(fastest.time) ? fastest.mirror : "";
    mirrorCache.set(cacheKey, { mirror, expiresAt: Date.now() + MIRROR_CACHE_TTL });
    return mirror;
}
