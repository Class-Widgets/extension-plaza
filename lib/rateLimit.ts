/**
 * 轻量级进程内滑动窗口限流器。
 *
 * 说明：这是「每个实例」的内存限流，不是跨实例共享的分布式限流。
 * 目的不是精确计数，而是显著抬高脚本刷量的成本——正常用户不可能
 * 每分钟打上百次接口，被拦截的请求不会再穿透到 Supabase / GitHub。
 * 若后续接入 Redis / Upstash，可在此文件替换实现而无需改动调用方。
 */

type Bucket = {
    /** 命中时间戳（毫秒），按升序排列 */
    hits: number[];
};

const buckets = new Map<string, Bucket>();

// 定期清理，防止内存无限增长。
const GC_INTERVAL_MS = 60_000;
let lastGc = 0;

function gc(windowMs: number) {
    const now = Date.now();
    if (now - lastGc < GC_INTERVAL_MS) return;
    lastGc = now;
    const cutoff = now - windowMs;
    for (const [key, bucket] of buckets) {
        bucket.hits = bucket.hits.filter((t) => t > cutoff);
        if (bucket.hits.length === 0) buckets.delete(key);
    }
}

export type RateLimitResult = {
    allowed: boolean;
    remaining: number;
    retryAfter: number;
};

/**
 * 消费一次配额。
 * @param key 唯一标识（通常是 IP + 分组名）
 * @param limit 窗口内允许的最大请求数
 * @param windowMs 窗口长度（毫秒）
 */
export function consume(key: string, limit: number, windowMs: number): RateLimitResult {
    gc(windowMs);
    const now = Date.now();
    const cutoff = now - windowMs;

    const bucket = buckets.get(key) ?? { hits: [] };
    bucket.hits = bucket.hits.filter((t) => t > cutoff);

    if (bucket.hits.length >= limit) {
        const oldest = bucket.hits[0];
        buckets.set(key, bucket);
        return {
            allowed: false,
            remaining: 0,
            retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
        };
    }

    bucket.hits.push(now);
    buckets.set(key, bucket);
    return { allowed: true, remaining: limit - bucket.hits.length, retryAfter: 0 };
}
