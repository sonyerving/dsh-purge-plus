# 0.2.1-rc.3 适配报告 / Compatibility note for DSH 0.2.1-rc.3

适用版本：dsh-purge **1.4.6**（`dshTarget: 0.2.1-rc.3`）。
上一份：见 [compat-0.2.1.md](compat-0.2.1.md)（0.2.1-rc.2 / 1.3.0 时代的适配记录）。

## 结论 / Summary

**补丁表零漂移。** 1.4.5 的 80 条补丁在 0.2.1-rc.3 上**一条 pattern 都不用改**：
rc.3 官方桌面构建上跑全量引擎是 `applied 63 / already 8 / missing_file 7 / skipped 2 / pending 0`，
二次、三次 apply 都是 `applied 0`（幂等），逐条状态与同一份 rc.2 对照树**完全相同（80/80 一致）**。

所以 1.4.6 不动任何替换文本，只做三件事：

1. `dshTarget` → `0.2.1-rc.3`，版本号 1.4.6；
2. `scripts/compat-check.mjs` 现在**也验证桌面壳补丁**（#45 / #46 / #82 / #83 / #84）。
   以前壳入口一律记成 `missing_file`，换 rc 版本时「壳锚点漂没漂」根本看不见——这正是 1.3.1 踩过的坑（#40 静默失效）；
3. 补上这份报告 + README / NOTICE / CHANGELOG 的版本同步。

## rc.3 相对 rc.2 改了什么（只列影响补丁的）

对比方法：npm 上 `@deepseek-ai/*@0.2.1-rc.2` 与 `@0.2.1-rc.3` 全量依赖树逐字节 diff（334 / 335 个包），
再用 rc.3 官方安装包（`deepseek-harness-0.2.1-rc.3-win-x64.exe`）里解出的 `resources/app.asar` 复核。

### 1. 补丁目标包里真正变的只有 1 个文件

| 文件 | 是否补丁目标 | 差异 | 影响 |
| --- | --- | --- | --- |
| `dsh-llm-deepseek/lib/index.js` | ✅ #69 / #72 | 新增 `/models` 列表拉取（`listing.js` / `listing-cache.js`）、`DEFAULT_MODELS` 挪位、`OFFICIAL_CONTEXT_WINDOW` 提常量、`APP_IDENTITY` 版本闸门、`semver` 依赖 | 两条锚点仍在原位，实测 `applied`；打完 `streamAgent` 相关文本 0 残留（#69），`historySystem = text` 命中（#72） |
| `dsh-client-ui-conversation/lib/client.js` | ❌ | View 标签（`view-pins`）、草稿 API 新增 `whenDraftExists` / `appendDraft` | 不影响：本插件的 `input.setDraft(text)` 是简写形式，rc.3 仍保留 `clearPreviousDraft` 兼容语义 |
| `dsh-web-app/cordis.patch.yml` | ❌ | web 面 bundle 行调整 | 不影响（#32 / #53 打的是 `dsh-harness-dev-context` 与 `dsh-web-app/lib/index.js`，两者逐字节未变） |

其余补丁目标包（`dsh-agent-instructions`、`dsh-system-prompt`、`dsh-user-approval`、`dsh-sandbox*`、`dsh-tool-*`、
`dsh-agent-loop`、`dsh-settings`、`dsh-permission-presets`、`dsh-session*`、`dsh-subagent`…）在 rc.3 里**逐字节未变**，
`package.json` 之外没有一行代码差异。

### 2. 桌面壳 `lib/main.js`：与 rc.2 只差 3 处

```
0a1        > （文件首多一个空行）
6689c6690  < return "0.2.1-rc.2";   →   > return "0.2.1-rc.3";
13197c13198 < export {};             →   > export {};（rc.3 末尾无换行）
```

也就是说 #45（官方更新接管）/ #46（ASCII 脚本）/ #82（profile 回退）/ #83 / #84（宿主退出码）的锚点天然有效。
1.4.6 起 `compat-check` 会把壳入口一起复制进临时树再校验，这条不再是「看不见的黑盒」。

### 3. rc.3 新增的东西与补丁表的关系

| rc.3 新特性 | 补丁表要不要动 | 说明 |
| --- | --- | --- |
| View 标签钉选（新包 `@deepseek-ai/dsh-client-ui-entry-customization`，`conversation.session.header.views.actions`） | 不用 | 纯前端；本插件挂在 `settings.section` / `shell.overlay` / `conversation.input.right`，三处 slot 在 rc.3 里都还在 |
| 草稿 API `whenDraftExists: 'keep' \| 'replace' \| 'append'` | 不用 | `#85 STEER_RESTORE_PROMPT` 打的是 `dsh-api-session-controller`，`#86` 打 `dsh-agent-loop`，两包未变；`already` 状态与 rc.2 一致 |
| `GET /models` 列表 + `client_requirements.<product>.min_version` 版本闸门 | 不用 | 属于模型目录发现，不产生新的拒绝话术；#69 / #72 已经把该文件改回「官方 in-history + 当前系统提示」 |
| 遥测事件扩充（`agent_preset_switch` / `send_button_click.is_new_session` / `more_menu_item_click` / `code_work_view_toggle`） | 不用（**观察项**） | 补丁表从 1.1.x 起就不动 `dsh-client-product-analytics`；本版沿用该行为，不在本次适配里改 |

## 实测数据 / Measured

命令：`node scripts/compat-check.mjs …`（1.4.6 版，含桌面壳校验）。全部在本机实测，退出码均为 0。

| 场景 | applied | already | missing_file | skipped | pending |
| --- | --- | --- | --- | --- | --- |
| 0.2.1-rc.2 原树（42 个目标包 + rc.2 官方壳） | 64 | 8 | 6 | 2 | 0 |
| **0.2.1-rc.3 原树（同包集 + rc.3 官方壳）** | **64** | **8** | **6** | **2** | **0** |
| 0.2.1-rc.3 官方 `app.asar`（real build：18,188 条目，含 pi-ai、无 hooks） | 63 | 8 | 7 | 2 | 0 |
| 0.2.1-rc.3 二次 / 三次 apply（幂等） | 0 | 71 | 7 | 2 | 0 |
| 本机已打补丁的 rc.2 安装（`--app resources/app`） | 0 | 71 | 7 | 2 | 0 |

两种原树的**逐条状态 80/80 完全一致**（用 `--json` 导出后按 `patch_id` 比对，无一条差异）。
`missing_file` 是这一份构建里确实没有的目标，不是锚点丢失：

- `#28` / `#71`：梁神预设（`@linxin666/dsh-liangshen`）没装；
- `#30` / `#31` / `#64` / `#65`：官方桌面构建不带 `dsh-hooks-claude-code` / `dsh-hooks-codex`（npm 依赖树里有，所以上表第一行是 6 不是 7）；
- `#76`：`$DSH_HOME` 下没有自定义的 `unrestricted` 预设；
- `#80`：`skipped` 是按版本主动跳过（0.2.1 新装没有那几行）。

## 怎么自查 / How to re-check

```bash
# 官方安装包（.exe）里解出 resources/app.asar 之后，直接打封着的归档
node scripts/compat-check.mjs --asar "D:\...\resources\app.asar" --surface desktop

# 已解开的安装目录（桌面壳在 <app>/lib/main.js，会被一起校验）
node scripts/compat-check.mjs --app "D:\...\resources\app" --surface desktop

# 输出每条状态到 JSON；--keep 保留临时树便于排查
node scripts/compat-check.mjs --asar <path> --json report.json --keep
```

退出码：0 = 没有 pending；1 = 还有 pending（说明这一版 dsh 又改了锚点）；2 = 参数或目录不对。

要检查的安装**不会被改写**：脚本解析完参数就把 argv 抹掉（否则 core 的宿主定位会把 `--app …/resources/app` 当成当前安装，桌面壳补丁直接写回被检查的目录），壳入口只从临时树取。验证办法：跑完对比 `lib/main.js` 的 sha256 不变。

从 `.exe` 里取 `app.asar`（本机实测可用）：

```bash
# 安装包内是 NSIS 包着的 7z；先按 `7z` 魔数切出载荷再解
7z l payload.7z | tail -3
7z e payload.7z -o"out" "resources/app.asar" "version" -y
```

## 已知限制 / Limits

- `compat-check` 只验「锚点是否命中 / 是否已是完成态」，**不验语义**：某条补丁如果 rc.4 把周围逻辑重写了，
  锚点仍可能命中而效果走样。语义复核靠 §「rc.3 相对 rc.2 改了什么」这张表 + 每次升级都重看目标文件 diff。
- 这次之所以能给出「零漂移」的结论，是因为拿到了 rc.3 官方 `app.asar` 与 npm 全量依赖树；
  只靠 `resources/app`（可能已被旧补丁改过）是证明不了的。
