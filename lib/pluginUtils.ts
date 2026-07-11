import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabase";

// GitHub存储库配置
const GITHUB_REPO = "https://github.com/Class-Widgets/plugin-plaza";
const GITHUB_BRANCH = "main";
const GITHUB_API_BASE = "https://raw.githubusercontent.com/Class-Widgets/plugin-plaza/main";

type PluginRow = {
    id: string;
    name: string;
    description: string | null;
    repo_url: string;
    branch: string;
    version: string;
    api_version: string | null;
    readme: string;
    icon: string;
    status: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
    cw_plugin_item_tags?: Array<{
        cw_plugin_tags?: { name: string } | { name: string }[] | null;
    }>;
};

type BannerSlide = {
    image: string;
    title: string;
    desc: string;
    pluginId?: string;
};

function normalizePluginRow(row: PluginRow, displayName?: string | null) {
    const tags = (row.cw_plugin_item_tags || [])
        .map((item) => Array.isArray(item.cw_plugin_tags) ? item.cw_plugin_tags[0]?.name : item.cw_plugin_tags?.name)
        .filter((name): name is string => Boolean(name));

    return {
        id: row.id,
        name: row.name,
        description: row.description || "",
        url: row.repo_url,
        repo_url: row.repo_url,
        repository: row.repo_url,
        branch: row.branch || "main",
        version: row.version || "1.0.0",
        api_version: row.api_version || undefined,
        readme: row.readme || "README.md",
        icon: row.icon || "icon.png",
        status: row.status,
        tags,
        author: displayName || row.owner_id || "",
        owner_id: row.owner_id,
        created: row.created_at,
        updated: row.updated_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function pluginSelect() {
    return `
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
        owner_id,
        created_at,
        updated_at,
        cw_plugin_item_tags(
            cw_plugin_tags(name)
        )
    `;
}

/** 批量查询 profiles 中指定用户的 display_name */
async function fetchDisplayNames(ownerIds: string[]): Promise<Record<string, string>> {
    const ids = [...new Set(ownerIds.filter(Boolean))];
    if (ids.length === 0) return {};

    const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', ids);

    if (error) {
        console.warn('fetchDisplayNames:', error.message);
        return {};
    }

    const map: Record<string, string> = {};
    for (const row of data ?? []) {
        if (row.display_name) map[row.id] = row.display_name;
    }
    return map;
}

export function getManifest(pluginId: string) {
    const pluginPath = path.join(process.cwd(), "manifests", `${pluginId}.json`);
    if (!fs.existsSync(pluginPath)) {
        throw new Error(`${pluginId} 插件不存在`);
    }
    const manifest = JSON.parse(fs.readFileSync(pluginPath, "utf-8"));
    return manifest;
}

/**
 * 解析 owner / repo
 */
export function parseGitHubRepo(url: string) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/|$)/);
    if (!match) throw new Error("GitHub URL 格式错误");
    return { owner: match[1], repo: match[2] };
}

/** 读取所有 manifests */
export async function getAllManifests(): Promise<any[]> {
    const manifestsDir = path.join(process.cwd(), 'manifests');
    const files = await fs.promises.readdir(manifestsDir);
    const manifests = await Promise.all(
        files.filter(f => f.endsWith('.json') && f !== 'tags.json').map(async (f) => {
            const text = await fs.promises.readFile(path.join(manifestsDir, f), 'utf-8');
            return JSON.parse(text);
        })
    );
    return manifests;
}

/** 读取标签字典，支持值为字符串或多语言对象 */
export function getTagsStore(): Record<string, string | Record<string, string>> {
    const tagsPath = path.join(process.cwd(), 'app', 'data', 'tags.json');
    if (!fs.existsSync(tagsPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(tagsPath, 'utf-8'));
    } catch {
        return {};
    }
}

/** 根据 tagId 映射展示文本（可选 locale） */
export async function getTagText(tagId: string, locale?: string): Promise<string> {
    try {
        const store = await getPluginTags();
        const v = store[tagId];
        if (!v) return tagId;
        if (typeof v === 'string') return v;
        
        // 优先使用指定的locale
        if (locale) {
            if (v[locale]) return v[locale];
            // 尝试不同的locale格式映射
            const localeMap: Record<string, string> = {
                'en': 'en_US',
                'zh-CN': 'zh_CN',
                'en_US': 'en',
                'zh_CN': 'zh-CN'
            };
            const mappedLocale = localeMap[locale];
            if (mappedLocale && v[mappedLocale]) return v[mappedLocale];
        }
        
        // 默认优先级：zh_CN, en_US, 其他
        return v['zh_CN'] || v['en_US'] || Object.values(v)[0] || tagId;
    } catch (error) {
        console.warn('Failed to fetch tags from Supabase, using local fallback:', error);
        const store = getTagsStore();
        const v = store[tagId];
        if (!v) return tagId;
        if (typeof v === 'string') return v;
        if (locale && v[locale]) return v[locale];
        return v['en'] || v['zh-CN'] || Object.values(v)[0] || tagId;
    }
}

/**
 * 处理 README 中的图片引用，将相对路径转换为完整的 GitHub 资源 URL，并应用代理。
 * @param readmeContent README 文本内容
 * @param repoUrl 仓库 URL (e.g., "https://github.com/owner/repo")
 * @param branch 仓库分支 (e.g., "main")
 * @param pickMirrorFor 代理函数
 * @param noMirror 如果为true，直接返回原始URL，跳过镜像选择
 * @returns 处理后的 README 文本内容
 */
export async function processReadmeImages(
    readmeContent: string,
    repoUrl: string,
    branch: string,
    pickMirrorFor: (url: string, noMirror?: boolean) => Promise<string>,
    noMirror: boolean = false
): Promise<string> {
    console.time(`processReadmeImages for ${repoUrl}`);
    const { owner, repo } = parseGitHubRepo(repoUrl);
    const githubRawBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;
    // 收集所有需要处理的图片 URL
    const imageUrls: { original: string; type: 'markdown' | 'html'; alt?: string; title?: string; attrs?: string }[] = [];

    // Markdown 图片: ![alt text](image/path "title")
    const markdownRegex = /!\[(.*?)\]\((?!https?:\/\/)(.*?)(?:\s+"(.*?)")?\)/g;
    let match;
    while ((match = markdownRegex.exec(readmeContent)) !== null) {
        imageUrls.push({
            original: match[2],
            type: 'markdown',
            alt: match[1],
            title: match[3],
        });
    }

    // HTML <img> 标签: <img src="image/path" alt="alt text" width="100">
    const htmlImgRegex = /<img\s+([^>]*?)src\s*=\s*["'](?!https?:\/\/)(.*?)["']([^>]*?)>/g;
    while ((match = htmlImgRegex.exec(readmeContent)) !== null) {
        imageUrls.push({
            original: match[2],
            type: 'html',
            attrs: `${match[1]} ${match[3]}`, // 捕获 src 前后的属性
        });
    }

    // 批量处理图片 URL
    const processedUrls = await Promise.all(imageUrls.map(async (img) => {
        const fullUrl = `${githubRawBaseUrl}/${img.original}`;
        let proxiedUrl = fullUrl; // 默认使用原始完整 URL
        try {
            const mirrorPrefix = await pickMirrorFor(fullUrl, noMirror);
            proxiedUrl = noMirror ? fullUrl : `${mirrorPrefix}/${fullUrl}`;
        } catch (error) {
            console.error(`Error proxying image ${fullUrl}:`, error);
            // 如果代理失败，则使用原始的 GitHub raw URL，或者在前端进行进一步处理
        }
        return { ...img, proxiedUrl };
    }));

    // 替换 README 内容
    let processedReadme = readmeContent;

    // 替换 Markdown 图片
    for (const img of processedUrls.filter(img => img.type === 'markdown')) {
        const titleAttr = img.title ? ` "${img.title}"` : '';
        // 使用一个更精确的替换，避免替换到已经处理过的 URL
        processedReadme = processedReadme.replace(
            `![${img.alt}](${img.original}${titleAttr})`,
            `![${img.alt}](${img.proxiedUrl}${titleAttr})`
        );
    }

    // 替换 HTML <img> 标签
    processedReadme = processedReadme.replace(htmlImgRegex, (fullMatch, preSrcAttrs, originalSrc, postSrcAttrs) => {
        const img = processedUrls.find(item => item.type === 'html' && item.original === originalSrc);
        if (img && img.proxiedUrl) {
            return `<img ${preSrcAttrs}src="${img.proxiedUrl}"${postSrcAttrs}>`;
        }
        return fullMatch; // 如果没有找到对应的代理 URL，则返回原始匹配
    });

    console.timeEnd(`processReadmeImages for ${repoUrl}`);
    return processedReadme;
}

/**
 * 从GitHub存储库获取Banner数据
 * @param name Banner名称，默认为'home'
 * @param noMirror 如果为true，直接返回原始URL，跳过镜像选择
 */
export async function getBanner(name: string = 'home', noMirror: boolean = false) {
    const bannerUrl = `${GITHUB_API_BASE}/ClassWidgets2/banners/${name}.json`;

    try {
        const response = await fetch(bannerUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch banner: ${response.statusText}`);
        }

        const bannerData = await response.json();

        // 处理图片路径，将相对路径转换为绝对路径
        if (bannerData.slides && Array.isArray(bannerData.slides)) {
            bannerData.slides = bannerData.slides.map((slide: any) => {
                let imagePath = slide.image;
                // 如果是相对路径（不以 http:// 或 https:// 开头），转换为绝对路径
                if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
                    // 如果以 /images/ 开头，直接替换为banners/images/
                    if (imagePath.startsWith('/images/')) {
                        imagePath = `${GITHUB_API_BASE}/ClassWidgets2/banners${imagePath}`;
                    }
                    // 如果以 images/ 开头，添加前导斜杠和banners目录
                    else if (imagePath.startsWith('images/')) {
                        imagePath = `${GITHUB_API_BASE}/ClassWidgets2/banners/${imagePath}`;
                    }
                    // 其他相对路径，假设相对于banners目录
                    else if (!imagePath.startsWith('/')) {
                        imagePath = `${GITHUB_API_BASE}/ClassWidgets2/banners/${imagePath}`;
                    }

                    // 如果noMirror为true，不使用镜像，直接返回原始URL
                    if (noMirror) {
                        imagePath = `${GITHUB_API_BASE}/ClassWidgets2/banners/images/${imagePath.replace('/images/', '')}`;
                    }
                }
                return {
                    ...slide,
                    image: imagePath
                };
            });
        }

        return bannerData;
    } catch (error) {
        console.error(`Error fetching banner from GitHub:`, error);
        throw error;
    }
}

export async function getPluginManifest(pluginId: string, noMirror: boolean = false) {
    void noMirror;

    const { data, error } = await supabase
        .schema('cw')
        .from('cw_plugins')
        .select(pluginSelect())
        .eq('id', pluginId)
        .eq('status', 'published')
        .single();

    if (error || !data) {
        throw new Error(`${pluginId} 插件不存在`);
    }

    const row = data as unknown as PluginRow;
    const nameMap = await fetchDisplayNames([row.owner_id]);
    return normalizePluginRow(row, nameMap[row.owner_id]);
}

export async function getPluginManifests(noMirror: boolean = false) {
    void noMirror;

    const { data, error } = await supabase
        .schema('cw')
        .from('cw_plugins')
        .select(pluginSelect())
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

    if (error) {
        throw error;
    }

    const rows = (data || []) as unknown as PluginRow[];
    const ownerIds = rows.map(r => r.owner_id);
    const nameMap = await fetchDisplayNames(ownerIds);

    return rows.map(row => normalizePluginRow(row, nameMap[row.owner_id]));
}

export async function getPluginRatingStats(pluginIds: string[]) {
    const ids = [...new Set(pluginIds.filter(Boolean))];
    if (ids.length === 0) return {};

    const { data, error } = await supabase
        .schema('cw')
        .from('cw_plugins_rating')
        .select('plugin_id, rating')
        .in('plugin_id', ids);

    if (error) {
        throw error;
    }

    const stats: Record<string, { rating_count: number; rating_average: number }> = {};
    for (const row of data ?? []) {
        const current = stats[row.plugin_id] ?? { rating_count: 0, rating_average: 0 };
        current.rating_count += 1;
        current.rating_average += Number(row.rating || 0);
        stats[row.plugin_id] = current;
    }

    for (const id of Object.keys(stats)) {
        stats[id].rating_average = stats[id].rating_count > 0 ? stats[id].rating_average / stats[id].rating_count : 0;
    }

    return stats;
}

/**
 * 处理Banner图片路径，将相对路径转换为GitHub绝对路径
 */
export function processBannerImages(bannerData: any) {
    if (!bannerData.slides || !Array.isArray(bannerData.slides)) {
        return bannerData;
    }
    
    bannerData.slides = bannerData.slides.map((slide: any) => {
        let imagePath = slide.image;
        // 如果是相对路径（不以 http:// 或 https:// 开头），转换为绝对路径
        if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
            // 如果以 /images/ 开头，直接替换为banners/images/
            if (imagePath.startsWith('/images/')) {
                imagePath = `${GITHUB_API_BASE}/ClassWidgets2/banners${imagePath}`;
            }
            // 如果以 images/ 开头，添加前导斜杠和banners目录
            else if (imagePath.startsWith('images/')) {
                imagePath = `${GITHUB_API_BASE}/ClassWidgets2/banners/${imagePath}`;
            }
            // 其他相对路径，假设相对于banners目录
            else if (!imagePath.startsWith('/')) {
                imagePath = `${GITHUB_API_BASE}/ClassWidgets2/banners/${imagePath}`;
            }
        }
        
        return {
            ...slide,
            image: imagePath
        };
    });
    
    return bannerData;
}

export async function getPluginTags(noMirror: boolean = false) {
    void noMirror;

    const { data, error } = await supabase
        .schema('cw')
        .from('cw_plugin_tags')
        .select('name')
        .order('name', { ascending: true });

    if (error) {
        throw error;
    }

    const localTags = getTagsStore();

    return Object.fromEntries((data || []).map((tag) => [tag.name, localTags[tag.name] || tag.name]));
}
