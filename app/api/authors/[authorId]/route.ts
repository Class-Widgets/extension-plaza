// app/api/authors/[authorId]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: Request, ctx: { params: Promise<{ authorId: string }> }) {
    const { authorId } = await ctx.params;

    try {
        // 查 profiles 获取 display_name
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, created_at')
            .eq('id', authorId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ ok: false, error: '用户不存在' }, { status: 404 });
        }

        // 查该用户投稿的所有已发布插件
        const { data: plugins, error: pluginsError } = await supabase
            .schema('cw')
            .from('cw_plugins')
            .select(`
                id,
                name,
                description,
                repo_url,
                branch,
                version,
                api_version,
                readme,
                icon,
                status,
                created_at,
                updated_at,
                cw_plugin_item_tags(
                    cw_plugin_tags(name)
                )
            `)
            .eq('owner_id', authorId)
            .eq('status', 'published')
            .order('updated_at', { ascending: false });

        if (pluginsError) {
            throw pluginsError;
        }

        const items = ((plugins || []) as any[]).map((row: any) => {
            const tags = (row.cw_plugin_item_tags || [])
                .map((item: any) =>
                    Array.isArray(item.cw_plugin_tags)
                        ? item.cw_plugin_tags[0]?.name
                        : item.cw_plugin_tags?.name
                )
                .filter((name: any): name is string => Boolean(name));

            return {
                id: row.id,
                name: row.name,
                description: row.description || '',
                repo_url: row.repo_url,
                branch: row.branch || 'main',
                version: row.version || '1.0.0',
                api_version: row.api_version || undefined,
                icon: row.icon || 'icon.png',
                status: row.status,
                tags,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };
        });

        return NextResponse.json({
            ok: true,
            data: {
                author: {
                    id: profile.id,
                    display_name: profile.display_name || profile.id,
                    created_at: profile.created_at,
                },
                plugins: items,
                total_plugins: items.length,
            },
        });
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}
