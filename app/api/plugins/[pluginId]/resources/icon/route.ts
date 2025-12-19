import { NextResponse } from "next/server";
import { getManifestFromGitHub } from "@/lib/pluginUtils";
import { pickMirrorFor } from "@/lib/mirrorUtils";

export async function GET(_req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
    const { pluginId } = await ctx.params;
    const manifest = await getManifestFromGitHub(pluginId);

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
        const mirror = await pickMirrorFor(iconUrl);
        // 处理镜像URL拼接，确保格式正确
        if (iconUrl.startsWith("https://raw.githubusercontent.com")) {
            // 对于raw.githubusercontent.com，替换为镜像URL + /raw.githubusercontent.com/
            iconUrl = `${mirror}/${iconUrl.replace("https://", "")}`;
        } else if (iconUrl.startsWith("https://github.com")) {
            // 对于github.com，替换为镜像URL + /github.com/
            iconUrl = `${mirror}/${iconUrl.replace("https://", "")}`;
        }
    }

    try {
        const res = await fetch(iconUrl);
        if (!res.ok) throw new Error(`fetch failed with status ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
            status: 200,
            headers: { "Content-Type": "image/png" },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 404 });
    }
}
