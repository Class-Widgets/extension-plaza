// app/api/plugins/[pluginId]/route.ts
import { NextResponse } from 'next/server';
import { getPluginManifest } from '@/lib/pluginUtils';

export async function GET(_req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
    try {
        const { pluginId } = await ctx.params;
        
        const manifest = await getPluginManifest(pluginId);
        
        // 构建完整的插件详情响应
        const pluginDetails = {
            ...manifest,
            // 可以在这里添加额外的插件信息
            resources: {
                icon: `/api/plugins/${pluginId}/resources/icon`,
                readme: `/api/plugins/${pluginId}/resources/readme`,
                release: `/api/plugins/${pluginId}/resources/release`
            }
        };
        
        return NextResponse.json({ 
            ok: true, 
            data: pluginDetails 
        });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 404 });
    }
}
