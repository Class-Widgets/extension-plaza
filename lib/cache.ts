/**
 * 统一的只读接口缓存策略。
 *
 * NextResponse.json() 默认不带 Cache-Control，route handler 又是动态的，
 * 所以边缘/CDN 层完全不会缓存，每个请求都会穿透到 Supabase。
 * 读接口加上这组头之后，可以被 Netlify Edge / 反向代理共享缓存，
 * 从而大幅降低源站压力、也天然抵御高频刷量。
 */

type PublicCacheOptions = {
    /** 浏览器缓存秒数，默认 60 */
    maxAge?: number;
    /** CDN / 边缘缓存秒数，默认 300 */
    sMaxAge?: number;
    /** 过期后允许返回旧值继续后台刷新的秒数，默认 600 */
    staleWhileRevalidate?: number;
};

export const PUBLIC_CACHE_HEADERS = (options: PublicCacheOptions = {}) => {
    const {
        maxAge = 60,
        sMaxAge = 300,
        staleWhileRevalidate = 600,
    } = options;

    return {
        "Cache-Control": `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    };
};
