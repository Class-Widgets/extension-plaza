# Extension Plaza

基于 [Next.js](https://nextjs.org/) 的插件广场站点。插件清单、标签与详情数据来自 Supabase `cw` schema；图标、README 与发布包根据插件记录中的 GitHub 仓库地址读取。本仓库同时提供一组 REST API 供站点前端与外部客户端（如 Class Widgets 客户端）调用。

## 快速开始

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看站点。

## 环境变量

在 `.env.local` 中配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

## API 总览

所有 API 均以 `/api` 为前缀，返回统一结构：

```json
{ "ok": true, "data": {} }
```

出错时：

```json
{ "ok": false, "error": "错误信息" }
```

常见 HTTP 状态码：`200` 成功、`400` 参数错误、`401` 未授权、`404` 资源不存在、`405` 方法不允许、`500` 服务器内部错误。

| # | 方法 | 端点 | 说明 |
|---|------|------|------|
| 1 | GET | `/api/banners` | 获取首页横幅 |
| 2 | GET | `/api/plugins` | 插件列表（分页） |
| 3 | GET | `/api/plugins/[pluginId]` | 插件详情 |
| 4 | GET | `/api/plugins/search` | 搜索插件 |
| 4.5 | GET | `/api/plugins/suggest` | 搜索建议（Autofill） |
| 4.6 | GET | `/api/plugins/random` | 随机推荐插件 |
| 5 | GET | `/api/plugins/tags` | 标签字典 / 标签查询 |
| 6 | GET | `/api/plugins/category` | 按标签筛选插件 |
| 7 | GET | `/api/plugins/latest` | 最新插件 |
| 8 | GET | `/api/plugins/popular` | 热门插件 |
| 9 | GET | `/api/plugins/[pluginId]/resources/icon` | 插件图标 |
| 10 | GET | `/api/plugins/[pluginId]/resources/manifest` | 插件清单 |
| 11 | GET | `/api/plugins/[pluginId]/resources/readme` | 插件 README |
| 12 | GET | `/api/plugins/[pluginId]/resources/release` | 插件发布包（重定向） |
| 13 | POST | `/api/plugins/[pluginId]/publish` | 发布 / 更新插件（代理 Edge Function） |
| 14 | GET | `/api/authors/[authorId]` | 作者信息及投稿插件 |

### 通用查询参数

| 参数名 | 类型 | 描述 | 默认值 |
|-------|------|------|--------|
| `no-mirror` | boolean | 是否禁用镜像服务（`true` 时直连 GitHub） | `false` |
| `limit` | number | 返回数量 | `undefined` |
| `offset` | number | 偏移量 | `0` |
| `page` | number | 页码 | `1` |
| `per_page` | number | 每页数量 | `20` |
| `sort` | string | 排序方式：`latest` / `name` / `rating` / `downloads` | `latest` |

---

## 1. 横幅 API

`GET /api/banners`

获取首页横幅数据。

**参数**

| 参数名 | 类型 | 描述 | 默认值 |
|-------|------|------|--------|
| `name` | string | 横幅名称 | `home` |
| `no-mirror` | boolean | 是否禁用镜像 | `false` |

**调用示例**

```bash
curl "http://localhost:3000/api/banners?name=home"
```

**返回范例**

```json
{
  "ok": true,
  "data": {
    "slides": [
      {
        "title": "Class Widgets",
        "subtitle": "使用ClassWidgets SDK",
        "image": "https://raw.githubusercontent.com/Class-Widgets/plugin-plaza/main/ClassWidgets2/banners/images/home.png"
      }
    ]
  }
}
```

## 2. 插件列表 API

`GET /api/plugins`

获取所有插件清单，支持 `limit/offset` 与 `page/per_page` 两种分页方式。同时传两种参数时，`page/per_page` 优先。

**调用示例**

```bash
curl "http://localhost:3000/api/plugins?page=1&per_page=20"
```

**返回范例**

```json
{
  "ok": true,
  "data": [
    {
      "id": "com.classwidgets.example-plugin",
      "name": "示例插件",
      "description": "在桌面使用示例插件",
      "repo_url": "https://github.com/owner/example-plugin",
      "branch": "main",
      "version": "1.2.0",
      "api_version": "0.6.0",
      "readme": "README.md",
      "icon": "icon.png",
      "status": "published",
      "tags": [{"id": "tag_id", "name": "标签名称"}, {"id": "tools", "name": "工具"}],
      "author": "owner",
      "created": "2026-01-01T00:00:00.000Z",
      "updated": "2026-07-01T12:00:00.000Z",
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-07-01T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "per_page": 20,
    "page": 1,
    "total_pages": 5,
    "limit": 20,
    "offset": 0
  }
}
```

## 3. 插件详情 API

`GET /api/plugins/[pluginId]`

获取单个插件详情，响应中附带各资源端点的相对路径。

**调用示例**

```bash
curl "http://localhost:3000/api/plugins/chatgpt-widget"
```

**返回范例**

```json
{
  "ok": true,
  "data": {
    "id": "com.classwidgets.example-plugin",
    "name": "示例插件",
    "description": "教学示例描述内容",
    "repo_url": "https://github.com/Class-Widgets/plugin-template-v2",
    "branch": "main",
    "version": "1.2.0",
    "api_version": "0.6.0",
    "readme": "README.md",
    "icon": "icon.png",
    "status": "published",
    "tags": [{"id": "tag_id", "name": "标签类型"}],
    "author": "owner",
    "resources": {
      "icon": "/api/plugins/chatgpt-widget/resources/icon",
      "readme": "/api/plugins/chatgpt-widget/resources/readme",
      "release": "/api/plugins/chatgpt-widget/resources/release"
    }
  }
}
```

## 4. 插件搜索 API

`GET /api/plugins/search`

在 `id`、`name`、`description`、`author` 与 `tags` 中模糊匹配关键词（不区分大小写）。`q` 为空时返回空数组。

**参数**

| 参数名 | 类型 | 描述 | 默认值 |
|-------|------|------|--------|
| `q` | string | 搜索关键词 | `""` |
| `tag` | string | 按标签 ID 过滤 | `""` |
| `sort` | string | 排序方式：`relevance` / `latest` / `name` / `rating` / `downloads` | `relevance` |
| `page` | number | 页码 | `1` |
| `per_page` | number | 每页数量 | `12` |

**调用示例**

```bash
curl "http://localhost:3000/api/plugins/search?q=ai"
```

**返回范例**

```json
{
  "ok": true,
  "data": [
    {
      "id": "com.classwidgets.example-plugin",
      "name": "示例插件",
      "tags": [{"id": "tag_id", "name": "标签类型"}]
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "per_page": 12,
    "total_pages": 4
  }
}
```

## 4.5 插件搜索建议 API

`GET /api/plugins/suggest`

输入关键词，返回搜索建议（Autofill）。建议来源包括插件名称 / ID、标签和作者，供搜索框下拉联想使用；`q` 为空时返回标签和作者关键词，供客户端填充搜索页面。

**参数**

| 参数名 | 类型 | 描述 | 默认值 |
|-------|------|------|--------|
| `q` | string | 搜索关键词 | `""` |
| `limit` | number | 返回建议数量上限（最大 `20`） | `8` |

**调用示例**

```bash
curl "http://localhost:3000/api/plugins/suggest?q=ai&limit=8"
```

**返回范例**

```json
{
  "ok": true,
  "data": [
    {
      "type": "plugin",
      "label": "示例插件",
      "value": "示例插件",
      "pluginId": "com.classwidgets.example-plugin"
    },
    {
      "type": "tag",
      "label": "ai",
      "value": "ai"
    },
    {
      "type": "author",
      "label": "owner",
      "value": "owner"
    }
  ],
  "meta": {
    "query": "ai",
    "limit": 8
  }
}
```

排序规则：前缀匹配优先，其次按类型（插件 > 标签 > 作者），再按名称长度；`q` 为空时仅返回标签和作者关键词。

## 4.6 随机推荐插件 API

`GET /api/plugins/random`

随机返回插件记录，适合客户端的推荐区域。

| 参数名 | 类型 | 描述 | 默认值 |
|-------|------|------|--------|
| `limit` | number | 返回插件数量上限（最大 `20`） | `6` |
## 5. 插件标签 API

`GET /api/plugins/tags`

- 不传 `ids` / `tag`：返回全部标签数组 `[{id, name}]`。
- 传入 `ids` / `tag`（逗号分隔）：返回匹配的标签子集。

**参数**

| 参数名 | 类型 | 描述 | 默认值 |
|-------|------|------|--------|
| `ids` | string | 标签 ID 列表，逗号分隔 | `""` |
| `tag` | string | 同 `ids`（别名） | `""` |

**调用示例**

```bash
# 获取全部标签
curl "http://localhost:3000/api/plugins/tags"

# 查询指定标签
curl "http://localhost:3000/api/plugins/tags?ids=ai,tools"
```

**返回范例**

```json
{
  "ok": true,
  "data": [
    { "id": "tag_id", "name": "标签名称" },
    { "id": "tools", "name": "工具" }
  ]
}
```

## 6. 插件分类 API

`GET /api/plugins/category`

按标签筛选插件。`tag` 为必填，支持逗号分隔多个标签，`mode` 控制是「任一匹配」还是「全部匹配」。

**参数**

| 参数名 | 类型 | 描述 | 默认值 |
|-------|------|------|--------|
| `tag` | string | 标签 ID 列表，逗号分隔 | 必填 |
| `mode` | string | 匹配模式：`any` / `all` | `any` |
| `sort` | string | 排序方式：`latest` / `name` / `rating` / `downloads` | `latest` |
| `no-mirror` | boolean | 是否禁用镜像服务 | `false` |
| `limit` / `offset` / `page` / `per_page` | number | 分页参数 | 见通用参数 |

**调用示例**

```bash
curl "http://localhost:3000/api/plugins/category?tag=ai,tools&mode=any&page=1&per_page=10"
```

**返回范例**

```json
{
  "ok": true,
  "data": [
    { "id": "com.classwidgets.example-plugin", "name": "示例插件", "tags": [{"id": "tag_id", "name": "标签类型"}] }
  ],
  "meta": {
    "total": 12,
    "per_page": 10,
    "page": 1,
    "total_pages": 2,
    "limit": 10,
    "offset": 0,
    "tag": "tag, tools",
    "mode": "any"
  }
}
```

## 7. 最新插件 API

`GET /api/plugins/latest`

按 `updated_at` 倒序返回插件。

**参数**

| 参数名 | 类型 | 描述 | 默认值 |
|-------|------|------|--------|
| `limit` | number | 返回数量 | `10` |
| `no-mirror` | boolean | 是否禁用镜像服务 | `false` |

**调用示例**

```bash
curl "http://localhost:3000/api/plugins/latest?limit=5"
```

**返回范例**

```json
{
  "ok": true,
  "data": [
    { "id": "chatgpt-widget", "name": "ChatGPT Widget", "updated_at": "2026-07-01T12:00:00.000Z" }
  ],
  "meta": { "total": 100, "limit": 5 }
}
```

## 8. 热门插件 API

`GET /api/plugins/popular`

按评分（评级数量优先，再按平均分）倒序返回插件。

**参数**

| 参数名 | 类型 | 描述 | 默认值 |
|-------|------|------|--------|
| `limit` | number | 返回数量 | `10` |

**调用示例**

```bash
curl "http://localhost:3000/api/plugins/popular?limit=5"
```

**返回范例**

```json
{
  "ok": true,
  "data": [
    { "id": "chatgpt-widget", "name": "ChatGPT Widget" }
  ],
  "meta": { "total": 100, "limit": 5 }
}
```

## 9. 插件资源 API

### 9.1 插件图标

`GET /api/plugins/[pluginId]/resources/icon`

返回二进制图标，`Content-Type: image/png`。

```bash
curl "http://localhost:3000/api/plugins/chatgpt-widget/resources/icon" -o icon.png
```

### 9.2 插件清单

`GET /api/plugins/[pluginId]/resources/manifest`

返回原始 manifest 对象（注意：此处直接返回 manifest，不包裹 `ok` 字段）。

```bash
curl "http://localhost:3000/api/plugins/chatgpt-widget/resources/manifest"
```

```json
{
  "id": "chatgpt-widget",
  "name": "ChatGPT Widget",
  "version": "1.2.0",
  "repo_url": "https://github.com/owner/chatgpt-widget"
}
```

### 9.3 插件 README

`GET /api/plugins/[pluginId]/resources/readme`

返回文本格式 README，`Content-Type: text/plain; charset=utf-8`。README 中的相对图片路径会被改写为镜像地址。响应带 5 分钟内存缓存。

```bash
curl "http://localhost:3000/api/plugins/chatgpt-widget/resources/readme"
```

### 9.4 获取插件发布包

`GET /api/plugins/[pluginId]/resources/release`

`302` 重定向到 GitHub Release 下载链接。

| 参数名 | 类型 | 描述 | 默认值 |
|-------|------|------|--------|
| `format` | string | 发布包格式：`zip` / `cwplugin` | `cwplugin` |

```bash
curl -L "http://localhost:3000/api/plugins/com.classwidgets.example-plugin/resources/release?format=zip" -o example-plugin.zip
```

## 10. 发布 / 更新插件 API

`POST /api/plugins/[pluginId]/publish`

<!-- 本端点代理 Supabase Edge Function `publish-plugin`，调用方无需使用长链接 `https://<project>.supabase.co/functions/v1/publish-plugin`，直接通过本站相对路径即可发布或更新自己的插件。 -->

**鉴权**

- 请求头 `X-CWPT-Token` 必填：发布令牌明文（形如 `cwpt_...`），由插件广场控制台生成并仅展示一次。
- 路径中的 `[pluginId]` 会作为 `X-CWPT-Plugin-Id` 头自动转发给 Edge Function，调用方无需再单独传该头。
- Edge Function 会校验令牌归属与插件 owner 是否一致。

**请求体（JSON）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 否 | 插件 ID；缺省时使用路径中的 `pluginId` |
| `name` | string | 是 | 插件名称 |
| `version` | string | 是 | 版本号 |
| `api_version` | string | 是 | 适配的客户端 API 版本 |
| `repo_url` | string | 是 | 仓库地址 |
| `description` | string | 否 | 描述 |
| `branch` | string | 否 | 仓库分支，默认 `main` |
| `readme` | string | 否 | README 文件名，默认 `README.md` |
| `icon` | string | 否 | 图标文件名，默认 `icon.png` |
| `tag_ids` | string[] | 否 | 标签 ID 列表，会与现有标签做全量同步 |

**调用示例**

```bash
curl -X POST "http://localhost:3000/api/plugins/chatgpt-widget/publish" \
  -H "X-CWPT-Token: cwpt_xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ChatGPT Widget",
    "version": "1.3.0",
    "api_version": "0.6.0",
    "repo_url": "https://github.com/owner/chatgpt-widget",
    "branch": "main",
    "description": "在桌面使用 ChatGPT",
    "readme": "README.md",
    "icon": "icon.png",
    "tag_ids": ["ai", "tools"]
  }'
```

**成功返回范例（200）**

```json
{
  "ok": true,
  "auth": {
    "tokenName": "my-publish-token",
    "scopePluginId": "chatgpt-widget"
  },
  "plugin": {
    "id": "com.classwidgets.example-plugin",
    "updated": {
      "name": "示例插件",
      "description": "在桌面使用示例插件",
      "repo_url": "https://github.com/owner/example-plugin",
      "branch": "main",
      "version": "1.3.0",
      "api_version": "0.6.0",
      "readme": "README.md",
      "icon": "icon.png"
    },
    "updated_at": "2026-07-10T08:00:00.000Z"
  },
  "tags": {
    "requestedTagCount": 2,
    "existingTagCount": 2,
    "appliedTagCount": 2,
    "removedTagCount": 1
  }
}
```

**失败返回范例**

令牌缺失 / 无效（401）：

```json
{
  "ok": false,
  "error": "Missing X-CWPT-Token header"
}
```

令牌与插件 owner 不匹配（401）：

```json
{
  "ok": false,
  "error": "Token owner does not match plugin owner",
  "debug": { "step": "verify-token", "pluginIdSent": "com.classwidgets.example-plugin" }
}
```

请求体字段缺失（400）：

```json
{
  "ok": false,
  "error": "Missing or invalid field: version"
}
```

---

## 11. 作者信息 API

`GET /api/authors/[authorId]`

获取作者基本信息及其投稿的所有已发布插件。

**参数**

| 参数名 | 类型 | 描述 |
|-------|------|------|
| `authorId` | string（路径） | 用户 UUID（对应 `profiles.id`） |

**调用示例**

```bash
curl "http://localhost:3000/api/authors/550e8400-e29b-41d4-a716-446655440000"
```

**返回范例**

```json
{
  "ok": true,
  "data": {
    "author": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "display_name": "张三",
      "created_at": "2025-08-01T12:00:00.000Z"
    },
    "plugins": [
      {
        "id": "com.classwidgets.example-plugin",
        "name": "示例插件",
        "description": "在桌面使用示例插件",
        "repo_url": "https://github.com/owner/example-plugin",
        "branch": "main",
        "version": "1.3.0",
        "api_version": "0.6.0",
        "icon": "icon.png",
        "status": "published",
        "tags": [{"id": "tag_id", "name": "标签名称"}, {"id": "widget", "name": "Widget"}],
        "created_at": "2025-09-01T10:00:00.000Z",
        "updated_at": "2026-07-10T08:00:00.000Z"
      }
    ],
    "total_plugins": 1
  }
}
```

**失败返回范例**

用户不存在（404）：
```json
{
  "ok": false,
  "error": "用户不存在"
}
```

---

## 部署

推荐使用 [Vercel](https://vercel.com/) 部署，详见 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying)。

```bash
npm run build
npm run start
```
