import { mirrorSources, apiMirrorSources } from "@/mirrorSources";

async function testMirror(url: string) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        // 使用Date.now()代替performance.now()以提高兼容性
        const start = Date.now();

        // 使用简单的GET请求测试镜像可用性，只获取前几个字节
        await fetch(url, { 
            method: "GET", 
            signal: controller.signal,
            headers: { "Range": "bytes=0-100" } // 只请求前100字节以提高速度
        });

        clearTimeout(timeout);
        return Date.now() - start;
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
 * @param url 原始URL
 * @param noMirror 如果为true，直接返回原始URL，跳过镜像选择
 */
export async function pickMirrorFor(url: string, noMirror: boolean = false): Promise<string> {
    // 如果noMirror为true，直接返回原始URL
    if (noMirror) {
        return url;
    }
    
    // 根据URL类型选择镜像源
    const sources = url.includes("api.github.com") ? apiMirrorSources : mirrorSources;
    
    // 创建测试URLs，使用实际资源URL的一部分进行测试
    // 选择一个简单的GitHub资源作为测试目标
    const testUrl = "https://github.com/Class-Widgets/plugin-plaza/raw/main/README.md";
    
    // 测试所有镜像源
    const tests = await Promise.all(
        sources.map(async (mirror) => {
            // 构造完整的测试URL
            const fullTestUrl = `${mirror}/${testUrl.replace("https://", "")}`;
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
    return tests[0].mirror;
}
