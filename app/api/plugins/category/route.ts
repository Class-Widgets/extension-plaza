// app/api/plugins/category/route.ts
import { NextResponse } from 'next/server';
import { getAllManifestsFromGitHub } from '@/lib/pluginUtils';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const noMirror = url.searchParams.get('no-mirror') === 'true';
        const tag = url.searchParams.get('tag') || '';
        const mode = (url.searchParams.get('mode') || 'any').toLowerCase(); // 'any' | 'all'
        
        // 支持两种分页方式：
        // 1. 传统的limit/offset
        // 2. 应用商店风格的page/per_page
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '0', 10) : undefined;
        const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset') || '0', 10) : 0;
        
        const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page') || '1', 10) : 1;
        const per_page = url.searchParams.get('per_page') ? parseInt(url.searchParams.get('per_page') || '20', 10) : 20;
        
        if (!tag) {
            return NextResponse.json({ ok: false, error: 'Tag parameter is required' }, { status: 400 });
        }
        
        const queryTags = tag.split(',').map(s => s.trim()).filter(Boolean);
        
        const manifests = await getAllManifestsFromGitHub(noMirror);
        
        // 过滤包含指定标签的插件
        const filteredManifests = manifests.filter((manifest: any) => {
            const manifestTags = Array.isArray(manifest.tags) ? manifest.tags : [];
            
            if (mode === 'all') {
                // 所有标签都必须匹配
                return queryTags.every(queryTag => manifestTags.includes(queryTag));
            } else {
                // 任何一个标签匹配即可
                return queryTags.some(queryTag => manifestTags.includes(queryTag));
            }
        });
        
        // 计算分页参数
        let startIndex = offset;
        let endIndex = offset + (limit || filteredManifests.length);
        
        // 如果使用page/per_page参数，则覆盖startIndex和endIndex
        if (url.searchParams.has('page') || url.searchParams.has('per_page')) {
            startIndex = (page - 1) * per_page;
            endIndex = startIndex + per_page;
        }
        
        // 应用分页
        const paginatedManifests = filteredManifests.slice(startIndex, endIndex);
        const total = filteredManifests.length;
        const currentPage = url.searchParams.has('page') ? page : Math.floor(offset / (limit || per_page)) + 1;
        const itemsPerPage = url.searchParams.has('per_page') ? per_page : (limit || per_page);
        const totalPages = Math.ceil(total / itemsPerPage);
        
        return NextResponse.json({ 
            ok: true, 
            data: paginatedManifests,
            meta: {
                total: total,
                per_page: itemsPerPage,
                page: currentPage,
                total_pages: totalPages,
                // 保持向后兼容
                limit: itemsPerPage,
                offset: startIndex,
                tag: queryTags.join(','),
                mode: mode
            }
        });
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}