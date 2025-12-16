import fs from "fs";
import path from "path";

// GitHub存储库配置
const GITHUB_REPO = "https://github.com/Class-Widgets/plugin-plaza";
const GITHUB_BRANCH = "main";
const GITHUB_API_BASE = "https://raw.githubusercontent.com/Class-Widgets/plugin-plaza/main";

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
    // 迁移后：根目录 tags.json
    const tagsPath = path.join(process.cwd(), 'tags.json');
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
        const store = await getTagsFromGitHub();
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
        console.warn('Failed to fetch tags from GitHub, using local fallback:', error);
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
 * @returns 处理后的 README 文本内容
 */
export async function processReadmeImages(
    readmeContent: string,
    repoUrl: string,
    branch: string,
    pickMirrorFor: (url: string) => Promise<string>
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
            const mirrorPrefix = await pickMirrorFor(fullUrl);
            proxiedUrl = `${mirrorPrefix}/${fullUrl}`;
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
 */
export async function getBannerFromGitHub(name: string = 'home') {
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

/**
 * 从GitHub存储库获取单个Plugin Manifest
 */
export async function getManifestFromGitHub(pluginId: string) {
    const manifestUrl = `${GITHUB_API_BASE}/ClassWidgets2/plugins/manifest/${pluginId}.json`;
    
    try {
        const response = await fetch(manifestUrl);
        if (!response.ok) {
            throw new Error(`${pluginId} 插件不存在`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error fetching manifest from GitHub:`, error);
        throw error;
    }
}

/**
 * 从GitHub存储库获取所有Plugin Manifests
 */
export async function getAllManifestsFromGitHub() {
    // 由于GitHub Raw URL不支持目录列表，我们使用一个预定义的已知插件列表
    // 这些是GitHub仓库中实际存在的插件
    
    const knownPluginIds = [
        'example.plugin.id'
        // 可以在这里添加更多已知的插件ID
        // 例如: 'plugin.id.2', 'plugin.id.3', 等等
    ];
    
    try {
        // 获取每个插件的manifest
        const manifests = await Promise.all(
            knownPluginIds.map(async (pluginId) => {
                try {
                    return await getManifestFromGitHub(pluginId);
                } catch (error) {
                    console.warn(`Failed to fetch manifest for ${pluginId}:`, error);
                    return null;
                }
            })
        );
        
        const validManifests = manifests.filter(Boolean);
        console.log(`Successfully fetched ${validManifests.length} plugins from GitHub`);
        return validManifests;
    } catch (error) {
        console.error('Error fetching plugins from GitHub:', error);
        // 不再回退到本地方法，返回空数组
        return [];
    }
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

/**
 * 从GitHub存储库获取Tags数据
 */
export async function getTagsFromGitHub() {
    const tagsUrl = `${GITHUB_API_BASE}/ClassWidgets2/tags.json`;
    
    try {
        const response = await fetch(tagsUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch tags: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error fetching tags from GitHub:`, error);
        // 回退到本地方法
        return getTagsStore();
    }
}
