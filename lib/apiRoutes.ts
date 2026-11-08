export const PLUGIN_ICON_VERSION = "2";

export function getPluginIconUrl(pluginId: string): string {
    return `/api/plugins/${encodeURIComponent(pluginId)}/resources/icon?v=${PLUGIN_ICON_VERSION}`;
}
