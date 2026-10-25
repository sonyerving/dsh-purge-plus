# 1.4.5

## 中文

- 版本 **1.4.5**。这一版**不动补丁表**（仍是 80 条，宿主行为不变），只把「发版链路」和「元数据」补齐。
- **CI 改为本仓库自己发版**：`.github/workflows/release.yml` 的触发分支 `master` → `main`，job 条件改成 `github.repository == 'sonyerving/dsh-purge-plus'`。推送 `main` 即自动建 Release，并附上 `dsh-purge-<版本>.zip`。
- **`package.json` 指回本分支**：`repository` / `homepage` / `bugs`，以及 `dsh.install` 的 tarball / zip / git 三个地址，从上游 `YuJunZhiXue/dsh-purge` 改为本仓库 `main`。
- **文档版本对齐**：README 中英文顶部版本号、`NOTICE.md` 的「本分支版本」、`dsh://` 一键安装链接（原来还写着 1.1.71 + 上游仓库）全部改成 1.4.5 与本仓库；README 里 `master.tar.gz` / `dsh-purge-master` 的旧写法一并更正为 `main`。
- **提交方式变更**：从这一版起改用常规增量提交，不再每次 force push 一个快照提交。
- 装法不变：`dsh plugin --profile desktop add dsh-purge`，或用本仓库 `main.tar.gz`。装上后照旧「设置 → Purge → 应用」并重启宿主才生效。

## English

- Version **1.4.5** — the patch table is untouched (still 80 entries, host behaviour unchanged); this release only wires up publishing and fixes metadata.
- CI now publishes from this fork: trigger `master` → `main`, job guard → `sonyerving/dsh-purge-plus`. Pushing `main` creates a Release with `dsh-purge-<version>.zip` attached.
- `package.json` metadata (`repository`, `homepage`, `bugs`, and the three `dsh.install` URLs) now points at this fork's `main` instead of upstream.
- Docs aligned: README version headers (zh/en), `NOTICE.md` fork version, and the `dsh://` one-click install link (it still said 1.1.71 + the upstream repo); stale `master.tar.gz` / `dsh-purge-master` wording corrected to `main`.
- From this release on: normal incremental commits instead of one squashed snapshot per release.
- Install path unchanged; you still need Settings → Purge → Apply and a host restart.
