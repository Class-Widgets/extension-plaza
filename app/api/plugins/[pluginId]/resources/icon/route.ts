import { NextResponse } from "next/server";
import { getPluginManifest } from "@/lib/pluginUtils";
import { pickMirrorFor } from "@/lib/mirrorUtils";

const ICON_CACHE_HEADERS = {
    "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    "Eo-Cdn-Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800, durable",
};

export async function GET(req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
    const { pluginId } = await ctx.params;
    const manifest = await getPluginManifest(pluginId);

    let iconUrl = manifest.icon;
    if (!iconUrl.startsWith("http")) {
        const branch = manifest.branch || "main";
        
        // 将GitHub blob URL转换为raw URL格式
        try {
            const url = new URL(manifest.url);
            if (url.hostname === "github.com") {
                const pathParts = url.pathname.split("/").filter(Boolean);
                if (pathParts.length >= 2) {
                    const owner = pathParts[0];
                    const repo = pathParts[1];
                    // 使用raw.githubusercontent.com格式
                    iconUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${manifest.icon}`;
                } else {
                    // 如果URL格式不标准，使用原始方式
                    iconUrl = `${manifest.url}/blob/${branch}/${manifest.icon}`;
                }
            } else {
                // 非GitHub URL，使用原始方式
                iconUrl = `${manifest.url}/blob/${branch}/${manifest.icon}`;
            }
        } catch {
            // URL解析失败，使用原始方式
            iconUrl = `${manifest.url}/blob/${branch}/${manifest.icon}`;
        }

        // 获取镜像服务
        const noMirror = new URL(req.url).searchParams.get("no-mirror") === "true";
        const mirror = await pickMirrorFor(iconUrl, noMirror);
        iconUrl = mirror || iconUrl;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const upstream = await fetch(iconUrl, {
            cache: "no-store",
            redirect: "follow",
            signal: controller.signal,
        });
        const contentType = upstream.headers.get("content-type") || "";

        if (!upstream.ok || !contentType.toLowerCase().startsWith("image/")) {
            throw new Error(`Icon fetch failed with status ${upstream.status}`);
        }

        return new NextResponse(await upstream.arrayBuffer(), {
            status: 200,
            headers: {
                ...ICON_CACHE_HEADERS,
                "Content-Type": contentType,
            },
        });
    } catch (err: unknown) {
        // Keep the redirect as a fallback so a temporarily unreachable icon
        // host does not turn into a permanent API error.
        const fallback = NextResponse.redirect(iconUrl, 302);
        fallback.headers.set("Cache-Control", "no-store");
        fallback.headers.set(
            "X-Icon-Fetch-Error",
            err instanceof Error ? err.message : "Icon fetch failed",
        );
        return fallback;
    } finally {
        clearTimeout(timeout);
    }
}
