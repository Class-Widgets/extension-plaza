export function getPluginIconUrl(pluginId: string, version?: string): string {
    const params = new URLSearchParams();
    if (version) params.set("v", version);
    const query = params.toString();
    return `/api/plugins/${encodeURIComponent(pluginId)}/resources/icon${query ? `?${query}` : ""}`;
}
