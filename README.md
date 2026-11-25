# ham-badge

业余无线电（HAM）台站通联状态服务与 Material Design 3（MD3）风格可嵌入状态徽章。

## 功能特性

- **实时台站状态**：支持 `onair`（通联中）与 `close`（离线）状态，支持记录工作模式（`mode`）、频率（`freq`）与比赛/活动备注（`note`，最多 32 个字符）。
- **12 小时自动过期**：`onair` 状态超过 12 小时未更新会自动降级为 `OFF AIR`。
- **MD3 风格 SVG 徽章**：提供 `/status.svg` 动态矢量徽章，支持自定义标签、高度及隐藏部分字段。
- **即插即用 JS 组件**：提供 `/status.js`，一行 `<script>` 嵌入个人主页并每 60 秒自动刷新。
- **轻量持久化**：基于 Node.js 内置 `node:sqlite`（WAL 模式），零外部数据库依赖。

## 快速开始

```bash
npm install
STATUS_API_KEY="your-secret-key" npm start
```

开发模式（热重载）：

```bash
npm run dev
```

运行测试：

```bash
npm test
```

## 环境变量

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3003` | HTTP 监听端口 |
| `DB_PATH` | `./ham-status.db` | SQLite 数据库文件路径 |
| `AUTH_SERVICE` | `http://127.0.0.1:3002` | 外部 Token 鉴权服务地址 |
| `STATUS_API_KEY` | `""` | 内部 API Key（推荐独立部署时配置，用于 `X-API-Key` 或 `api_key`） |

## 鉴权说明

`POST /api/status` 支持两种鉴权模式，任选其一即可：

1. **独立部署（推荐）**：配置 `STATUS_API_KEY`，控制端在请求头传入 `X-API-Key: <key>`（或查询参数 `?api_key=<key>`），无需外部鉴权服务。
2. **接入外部验证服务**：传入 `Authorization: Bearer <token>` 或 `admin_token` Cookie，`ham-badge` 会请求 `GET ${AUTH_SERVICE}/verify-token?token=<token>`，返回 `{ "ok": true }` 即放行。

## HTTP 接口

- `GET /health`：健康检查，返回 `{ "ok": true }`
- `GET /` / `GET /api/status`：获取当前台站状态 JSON（`status`、`since`、`mode`、`freq`、`note`）
- `POST /api/status`：更新台站状态（需鉴权）
  - 上线（含比赛备注）：
    ```bash
    curl -X POST http://127.0.0.1:3003/api/status \
      -H "Content-Type: application/json" \
      -H "X-API-Key: your-secret-key" \
      -d '{"status":"onair","freq":"14.270","mode":"SSB","note":"CQWW"}'
    ```
  - 在线期间仅更新频率/模式/备注（不重置上线时间）：
    ```bash
    curl -X POST http://127.0.0.1:3003/api/status \
      -H "Content-Type: application/json" \
      -H "X-API-Key: your-secret-key" \
      -d '{"freq":"7.050","note":"POTA CN-0001"}'
    ```
  - 下线：
    ```bash
    curl -X POST http://127.0.0.1:3003/api/status \
      -H "Content-Type: application/json" \
      -H "X-API-Key: your-secret-key" \
      -d '{"status":"close"}'
    ```
- `GET /status.svg`：MD3 风格 SVG 状态徽章，支持参数：
  - `label`：左侧标签（默认 `STATION`）
  - `since=0|false|no|off`：隐藏 UTC 上线时间
  - `mode=0|false|no|off`：隐藏通联模式
  - `freq=0|false|no|off`：隐藏通联频率
  - `note=0|false|no|off`：隐藏备注信息
  - `h`：徽章高度（`16`–`128`，默认 `40`）
- `GET /status.js`：前端自动刷新嵌入脚本

## 网页嵌入示例

```html
<script src="https://your-domain.example/status.js?label=STATION"></script>
```

## 开源协议

[MIT](./LICENSE)
