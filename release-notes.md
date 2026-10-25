# 1.4.7

## 中文

- 版本 **1.4.7**。`dshTarget` 仍是 `0.2.1-rc.3`，**补丁表一条没动**（80 条，零锚点漂移）；这一版修的是**更新目标和文档**。
- **修更新目标（重要）**：插件内「更新 / 切换到正式版」原来写死上游 `YuJunZhiXue/dsh-purge` 的 `master`，在本 fork 上点更新会把**上游**装进来，等于把 rc.3 适配覆盖掉。现在仓库与分支从 `package.json` 推导（本仓库 `sonyerving/dsh-purge-plus` 的 `main`），旧客户端 / 旧 pin 里的 `master` 自动映射到 `main`，不会硬失败。
- **修安装说明**：`dsh-purge` **没有发布到 npm**（`registry.npmjs.org/dsh-purge` 404），而 `dsh plugin … add` 只是把参数转给 pnpm。README 原来主推的 `dsh plugin --profile web|desktop add dsh-purge` 必然失败，现在统一改成 tarball：`…/sonyerving/dsh-purge-plus/archive/refs/heads/main.tar.gz`，`add .` 保留。
- **删掉已删除功能的描述**：`/rewind` 与「回退一次 / 回退上一轮」整段（1.4.2 就删了，README 却还在教），本地校验里的 `lib/rewind.js`。
- **修默认值描述**：`autoApplyOnStart` 实际默认 **false**（启动只对齐状态戳，不写宿主），README 表格与 YAML 示例都写成 `true`，已改正。
- **导航名与预览标题**：设置导航行是 **Purge**（不是「破甲」，「破甲」是页内第一段）；预览小标题「清洗（浮窗）/ Clean (dock)」改成「设置页·破甲段」。
- **过期建议**：「请升到 1.1.61+」→「1.4.6 及以上」；`master.tar.gz` → `main.tar.gz`。
- **上游状态与许可口径**（按事实修正）：上游已恢复维护（2026-10-24 发布 v1.1.78，之后仍有提交），README 改成「上游已恢复 + 本分支只做 rc 适配 / 缺陷修复 / 自己的发版」；本仓库 `LICENSE` 是 fork 时继承的 MIT 原文（未改），上游当前标注 **Apache-2.0**，两边不一致——NOTICE 与 DISCLAIMER 补上说明，LICENSE 原文不动。
- **修 `compat-check` 的只读性**：旧版会把命令行里的 `--app …/resources/app` 当成当前安装（core 的宿主定位会扫 argv），桌面壳补丁直接写回被检查的那个目录。现在解析完参数就摸掉 argv，壳入口只走临时树，被检查的安装不会被改写。
- 清理：删掉没有任何引用的 `docs/preview/settings.png`。安装方式与补丁行为不变；`/purge`、`/rules`、`/skills` 命令和四个面板分段照旧。

## English

- Version **1.4.7**. `dshTarget` stays at `0.2.1-rc.3` and the patch table is **untouched** (80 entries, zero anchor drift); this release fixes the **updater target and the docs**.
- **Updater target (important)**: the in-plugin "Update / Switch to stable" was hard-coded to upstream `YuJunZhiXue/dsh-purge` on `master`, so on this fork it installed **upstream** over the rc.3 work. The repo and branch are now derived from `package.json` (this fork's `main`), and the legacy `master` in old clients / stored pins maps to `main` instead of failing.
- **Install instructions**: `dsh-purge` is **not published to npm** (`registry.npmjs.org/dsh-purge` returns 404) and `dsh plugin … add` only forwards arguments to pnpm, so the previously documented `add dsh-purge` could never work. Both READMEs now use the tarball URL (`…/sonyerving/dsh-purge-plus/archive/refs/heads/main.tar.gz`); `add .` still works from a clone.
- **Removed docs for removed features**: the `/rewind` command and the whole "Undo once / Undo last round" paragraph (gone since 1.4.2), plus `lib/rewind.js` in the local-checks list.
- **Corrected defaults**: `autoApplyOnStart` really defaults to **false** (startup only aligns the stamp, it does not write the host); the table row and the YAML sample said `true`.
- **Naming**: the settings rail row is **Purge** (not 破甲, which is the first segment inside the page); the preview heading "Clean (dock)" now reads "Armor segment".
- **Stale advice**: "use 1.1.61+" → "1.4.6 or newer"; `master.tar.gz` → `main.tar.gz`.
- **Upstream status and licence wording** (factual): upstream is maintained again (v1.1.78 on 2026-10-24, commits after), so the README now states that plus where this fork stands (rc compatibility, verified fixes, own releases). The repository `LICENSE` remains the MIT text inherited at fork time; upstream currently declares **Apache-2.0** — NOTICE and DISCLAIMER now say so explicitly and the licence text is left untouched.
- **`compat-check` is actually read-only now**: it used to let core's host discovery (which scans argv) treat `--app …/resources/app` as the live install, so desktop-shell patches were written back into the directory under test. Argv is stripped after parsing and the shell entry only ever comes from the temp tree, so the inspected installation is never modified.
- Cleanup: dropped the unreferenced `docs/preview/settings.png`. Install flow and patch behaviour are unchanged; `/purge`, `/rules`, `/skills` and the four panel segments stay as they were.
