import fs from "fs";
import path from "path";

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
export function getTagText(tagId: string, locale?: string): string {
    const store = getTagsStore();
    const v = store[tagId];
    if (!v) return tagId;
    if (typeof v === 'string') return v;
    if (locale && v[locale]) return v[locale];
    return v['en'] || v['zh-CN'] || Object.values(v)[0] || tagId;
}
