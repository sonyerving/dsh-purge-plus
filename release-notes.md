# 1.4.6

## 中文

- 版本 **1.4.6**，`dshTarget` 提到 **0.2.1-rc.3**。**补丁表一条没改**：80 条在 rc.3 官方桌面构建上实测 `63 applied / 8 already / 7 missing_file / 2 skipped / 0 pending`，二、三次 apply 都是 `applied 0`；同一份包集下逐条状态与 rc.2 对照树完全一致（80/80）。
- **为什么不用改**：rc.3 的补丁目标包里只有一个文件真变了（`dsh-llm-deepseek/lib/index.js`，新增 `/models` 列表与模型目录闸门；#69 / #72 锚点仍在）；桌面壳 `lib/main.js` 与 rc.2 只差三处（首行空行、版本字符串、末尾换行）；其余目标包逐字节未变。
- **`compat-check` 现在也验桌面壳**：以前壳入口落在临时目录之外，#45 / #46 / #82 / #83 / #84 永远记成 `missing_file`，「壳锚点在 rc.3 上还成不成立」从没被验证过。现在临时树自带 `DeepSeek Harness.exe` 与 `resources/app/lib/main.js`，`--surface desktop` 一跑就能看出壳补丁有没有漂；新增 `--keep` 保留临时树排查。
- **新文档** [`docs/compat-0.2.1-rc.3.md`](docs/compat-0.2.1-rc.3.md)：rc.2 → rc.3 的漂移明细（含 19 个变动文件为什么都不影响补丁）、实测数据表、从安装包 `.exe` 里取 `app.asar` 的命令。
- **rc.3 新增功能与补丁表的关系**：View 标签钉选、草稿 `whenDraftExists` / `appendDraft`、`GET /models` 都不需要新补丁；本插件用的三处 slot（`settings.section` / `shell.overlay` / `conversation.input.right`）在 rc.3 里都还在。
- **观察项（本版未处理）**：rc.3 扩充了产品遥测（`agent_preset_switch`、`send_button_click.is_new_session`、`more_menu_item_click`、`code_work_view_toggle`）。补丁表从 1.1.x 起就不动 `dsh-client-product-analytics`，这次沿用，只记在适配报告里——关遥测是另一件事，不混进版本适配。
- 装法不变：装上插件后在 **设置 → Purge → 应用**，再重启宿主；rc.3 上不需要重装或换配置。

## English

- Version **1.4.6**, `dshTarget` bumped to **0.2.1-rc.3**. The patch table is unchanged: all 80 entries measure `63 applied / 8 already / 7 missing_file / 2 skipped / 0 pending` on the official rc.3 desktop build, a second and third apply report `applied 0`, and per-patch statuses are identical (80/80) to the rc.2 control tree over the same package set.
- **Why nothing had to change**: exactly one patch-target file differs in rc.3 — `dsh-llm-deepseek/lib/index.js` (new `/models` listing and catalog gate; the #69 / #72 anchors are still in place). The desktop shell `lib/main.js` differs from rc.2 in three places only (leading blank line, version string, trailing newline), and every other target package is byte-identical.
- **`compat-check` now covers the desktop shell too**: previously the shell entry lived outside the temp tree, so #45 / #46 / #82 / #83 / #84 were always reported as `missing_file` and nobody ever verified whether the shell anchors survived a version bump. The temp tree now contains `DeepSeek Harness.exe` and `resources/app/lib/main.js`, so `--surface desktop` proves the shell patches settle, and `--keep` preserves the tree for debugging.
- **New report** [`docs/compat-0.2.1-rc.3.md`](docs/compat-0.2.1-rc.3.md): rc.2 → rc.3 drift details (including why the 19 changed files cannot affect the table), measured numbers, and the command to pull `app.asar` out of the installer `.exe`.
- **rc.3 features versus the table**: View tab pinning, the draft `whenDraftExists` / `appendDraft` API and `GET /models` need no new patches; all three slots this plugin uses (`settings.section`, `shell.overlay`, `conversation.input.right`) still exist in rc.3.
- **Observation, not handled here**: rc.3 expanded product analytics (`agent_preset_switch`, `send_button_click.is_new_session`, `more_menu_item_click`, `code_work_view_toggle`). The table has never touched `dsh-client-product-analytics`; that stays as-is and is recorded in the compat report only — turning telemetry off is a separate change, not part of a version bump.
- Install path unchanged: apply in **Settings → Purge**, then restart the host. No reinstall or config change is needed on rc.3.
