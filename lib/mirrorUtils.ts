import { mirrorSources, apiMirrorSources } from "@/mirrorSources";

async function testMirror(url: string) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const start = performance.now();

        // 使用 HEAD 测试响应时间
        await fetch(url, { method: "HEAD", signal: controller.signal });

        clearTimeout(timeout);
        return performance.now() - start;
    } catch {
        return Infinity; // 超时或错误，算作最慢
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
 */
export async function pickMirrorFor(url: string): Promise<string> {
    if (url.includes("api.github.com")) {
        return pickFastestApiMirror();
    }
    return pickFastestMirror();
}
