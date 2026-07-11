export type ConsoleView = "overview" | "submit" | "myPlugins" | "tokens" | "moderation" | "allPlugins";
export type AccountRole = "USER" | "MASTER" | "CW_MAINTAINER";

export type Profile = {
    id: string;
    role: AccountRole;
    display_name: string | null;
};

export type UserRoleRow = {
    user_id: string;
    role: AccountRole;
};

export type PluginRow = {
    id: string;
    owner_id: string;
    name: string;
    description: string | null;
    repo_url: string;
    branch: string;
    version: string;
    api_version: string | null;
    readme: string;
    icon: string;
    status: string;
    created_at: string;
    updated_at: string;
    tag_ids?: string[];
    tags?: TagRow[];
};

export type TagRow = {
    id: string;
    name: string;
    created_at?: string;
};

export type PluginTagJoin = {
    tag_id: string;
    cw_plugin_tags?: TagRow | TagRow[] | null;
};

export type PublishToken = {
    id: string;
    owner_id: string;
    name: string;
    scope_plugin_id: string | null;
    created_at: string;
    last_used_at: string | null;
    expires_at: string | null;
    revoked: boolean;
};

export type ModerationRequest = {
    id: string;
    plugin_id: string;
    user_id: string;
    request_type: string;
    reason: string | null;
    decided_reason: string | null;
    status: string;
    created_at: string;
    decided_at: string | null;
    cw_plugins?: PluginRow | PluginRow[] | null;
};

export type PluginForm = {
    id: string;
    name: string;
    description: string;
    repo_url: string;
    branch: string;
    version: string;
    api_version: string;
    readme: string;
    icon: string;
    reason: string;
    tag_ids: string[];
};
