export type CheckResult = {
    label: string;
    status: "idle" | "checking" | "pass" | "fail";
    message: string;
};

export type VerificationResults = {
    repoExists: CheckResult;
    branchExists: CheckResult;
    iconExists: CheckResult;
    readmeExists: CheckResult;
    versionMatch: CheckResult;
};

const GITHUB_API = "https://api.github.com";
const GITHUB_RAW = "https://raw.githubusercontent.com";

function parseRepoUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export async function resolvePluginBranch(repoUrl: string, requestedBranch: string): Promise<string> {
    const branch = requestedBranch.trim();
    if (branch && branch.toUpperCase() !== "HEAD") return branch;

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
        throw new Error("无法解析 GitHub 仓库 URL，不能确定默认分支");
    }

    const res = await fetch(`${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}`);
    if (!res.ok) {
        throw new Error(`无法读取仓库默认分支（${res.status}）`);
    }

    const data = await res.json() as { default_branch?: unknown };
    const defaultBranch = typeof data.default_branch === "string" ? data.default_branch.trim() : "";
    if (!defaultBranch || defaultBranch.toUpperCase() === "HEAD") {
        throw new Error("仓库未返回有效的默认分支");
    }

    return defaultBranch;
}

async function checkRepoExists(owner: string, repo: string): Promise<CheckResult> {
    try {
        const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`);
        if (res.ok) {
            return { label: "仓库存在", status: "pass", message: `${owner}/${repo}` };
        }
        return { label: "仓库存在", status: "fail", message: `仓库 ${owner}/${repo} 不存在（${res.status}）` };
    } catch {
        return { label: "仓库存在", status: "fail", message: "网络错误，无法访问 GitHub" };
    }
}

async function checkBranchExists(owner: string, repo: string, branch: string): Promise<CheckResult> {
    try {
        const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/branches/${branch}`);
        if (res.ok) {
            return { label: "分支存在", status: "pass", message: `分支 ${branch}` };
        }
        return { label: "分支存在", status: "fail", message: `分支 ${branch} 不存在（${res.status}）` };
    } catch {
        return { label: "分支存在", status: "fail", message: "网络错误" };
    }
}

async function checkFileExists(owner: string, repo: string, branch: string, path: string): Promise<CheckResult> {
    try {
        const res = await fetch(`${GITHUB_RAW}/${owner}/${repo}/${branch}/${path}`);
        if (res.ok) {
            return { label: path, status: "pass", message: "存在" };
        }
        return { label: path, status: "fail", message: `不存在（${res.status}）` };
    } catch {
        return { label: path, status: "fail", message: "网络错误" };
    }
}

async function checkVersionMatch(owner: string, repo: string, version: string): Promise<CheckResult> {
    try {
        const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/releases/latest`);
        if (res.ok) {
            const data = await res.json();
            const latestTag = (data.tag_name || "").replace(/^v/, "");
            if (latestTag === version.replace(/^v/, "")) {
                return { label: "版本匹配", status: "pass", message: `最新 Release: ${data.tag_name}` };
            }
            return {
                label: "版本匹配",
                status: "fail",
                message: `提交版本 ${version}，最新 Release: ${data.tag_name}`,
            };
        }
        if (res.status === 404) {
            return { label: "版本匹配", status: "fail", message: "仓库无 Release" };
        }
        return { label: "版本匹配", status: "fail", message: `查询失败（${res.status}）` };
    } catch {
        return { label: "版本匹配", status: "fail", message: "网络错误" };
    }
}

export async function verifyPlugin(
    repoUrl: string,
    branch: string,
    version: string,
    icon: string,
    readme: string,
): Promise<VerificationResults> {
    const parsed = parseRepoUrl(repoUrl);

    const base: VerificationResults = {
        repoExists: { label: "仓库存在", status: "idle", message: "" },
        branchExists: { label: "分支存在", status: "idle", message: "" },
        iconExists: { label: `图标 (${icon})`, status: "idle", message: "" },
        readmeExists: { label: `README (${readme})`, status: "idle", message: "" },
        versionMatch: { label: "版本匹配", status: "idle", message: "" },
    };

    if (!parsed) {
        return {
            ...base,
            repoExists: { label: "仓库存在", status: "fail", message: "无法解析仓库 URL" },
        };
    }

    const { owner, repo } = parsed;

    const [repoCheck, branchCheck, iconCheck, readmeCheck, versionCheck] = await Promise.all([
        checkRepoExists(owner, repo),
        checkBranchExists(owner, repo, branch),
        checkFileExists(owner, repo, branch, icon),
        checkFileExists(owner, repo, branch, readme),
        checkVersionMatch(owner, repo, version),
    ]);

    return {
        repoExists: repoCheck,
        branchExists: branchCheck,
        iconExists: { ...iconCheck, label: `图标 (${icon})` },
        readmeExists: { ...readmeCheck, label: `README (${readme})` },
        versionMatch: versionCheck,
    };
}

/**
 * 判断是否所有项都通过
 */
export function allChecksPassed(results: VerificationResults): boolean {
    return Object.values(results).every((r) => r.status === "pass");
}
