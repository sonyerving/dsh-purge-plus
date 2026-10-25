#!/usr/bin/env node
/**
 * dsh-purge 兼容性自检 / compatibility self-check.
 *
 * 从一个 DSH 构建里只取出「补丁目标文件」，复制到临时目录，再跑完整补丁引擎，
 * 逐个补丁报告 applied / already / skipped。真实安装目录只读，不会被改写。
 *
 * Only the files the patch table targets are copied to a temp tree; the real
 * installation is read-only. Every patch is then applied to that copy.
 *
 * 0.2.1-rc.3 起临时树按「桌面安装形态」搭建：
 *   <tmp>/DeepSeek Harness.exe
 *   <tmp>/resources/app/lib/main.js            ← 桌面壳入口（#45/#46/#82/#83/#84）
 *   <tmp>/resources/app/dsh/node_modules/@deepseek-ai/...
 * 并把 DSH_DESKTOP_INSTALL 指到临时树。以前壳补丁一律记成 missing_file，
 * 换 rc 版本时「壳锚点漂了没有」根本看不出来 —— 这里补上。
 *
 * 用法 / Usage:
 *   node scripts/compat-check.mjs --asar "C:\...\resources\app.asar"
 *   node scripts/compat-check.mjs --app  "C:\...\resources\app"
 *   node scripts/compat-check.mjs --asar ... --surface web --json out.json
 *   node scripts/compat-check.mjs --asar ... --keep     # 保留临时树便于排查
 *
 * 退出码 / Exit code: 0 = 没有待打补丁；1 = 仍有 pending；2 = 参数错误。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function usage(msg) {
  if (msg) console.error(msg);
  console.error(
    'usage: node scripts/compat-check.mjs --asar <app.asar> | --app <appDir> [--surface web|desktop] [--json out.json] [--keep]',
  );
  process.exit(2);
}

const argv = process.argv.slice(2);
let asar = "";
let appDir = "";
let surface = "";
let jsonOut = "";
let keep = false;
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  const next = () => argv[++i];
  if (a === "--asar") asar = next();
  else if (a === "--app") appDir = next();
  else if (a === "--surface") surface = next();
  else if (a === "--json") jsonOut = next();
  else if (a === "--keep") keep = true;
  else if (a === "-h" || a === "--help") usage();
  else usage(`unknown argument: ${a}`);
}
if (!asar && !appDir) usage("need --asar or --app");
if (asar && appDir) usage("pass only one of --asar / --app");

// 把 --app / --asar 从 argv 里摸掉：core 的宿主定位会扫 argv 里的 `…/resources/app`，
// 一旦命中就会把**源目录**当成当前安装，桌面壳补丁直接写回源目录（compat-check 必须是只读的）。
// 壳入口一律走下面指向临时树的 DSH_DESKTOP_INSTALL。
process.argv = process.argv.slice(0, 2);

if (!surface) {
  surface = /deepseek[\s._-]*harness|dsh desktop/i.test(asar || appDir) ? "desktop" : "web";
}

const realAppDir = appDir ? path.resolve(appDir) : path.dirname(path.resolve(asar));
const realAiBase = path.join(realAppDir, "dsh", "node_modules", "@deepseek-ai");
if (appDir && !fs.existsSync(realAiBase)) {
  console.error(`not a DSH build (missing dsh/node_modules/@deepseek-ai): ${realAppDir}`);
  process.exit(2);
}

/** 读 app.asar 头，返回 { entries, dataStart }。 */
function readAsarIndex(file) {
  const fd = fs.openSync(file, "r");
  const head = Buffer.alloc(16);
  fs.readSync(fd, head, 0, 16, 0);
  const headerSize = head.readUInt32LE(12);
  const raw = Buffer.alloc(headerSize);
  fs.readSync(fd, raw, 0, headerSize, 16);
  let text = raw.toString("utf8");
  const end = text.lastIndexOf("}");
  if (end >= 0) text = text.slice(0, end + 1);
  const index = JSON.parse(text);
  const entries = new Map();
  (function walk(node, prefix) {
    for (const [name, entry] of Object.entries(node.files || {})) {
      const p = prefix ? prefix + "/" + name : name;
      if (entry.files) walk(entry, p);
      else entries.set(p, entry);
    }
  })(index, "");
  return { fd, entries, dataStart: 16 + Buffer.byteLength(text, "utf8") };
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-purge-compat-"));
const tmpHome = path.join(tmpRoot, "home");
fs.mkdirSync(tmpHome, { recursive: true });
// 临时树按桌面安装形态摆好；壳入口在 resources/app 下，AI 包在 resources/app/dsh 下。
const tmpInstall = path.join(tmpRoot, "install");
const tmpApp = path.join(tmpInstall, "resources", "app");
const tmpAiBase = path.join(tmpApp, "dsh", "node_modules", "@deepseek-ai");
fs.mkdirSync(tmpAiBase, { recursive: true });

// 环境必须在 import core 之前定好：core 的宿主定位会读 DSH_SURFACE / DSH_DESKTOP_INSTALL。
process.env.DSH_HOME = tmpHome;
process.env.DSH_SURFACE = surface;
if (surface === "desktop") {
  fs.writeFileSync(path.join(tmpInstall, "DeepSeek Harness.exe"), Buffer.alloc(0));
  process.env.DSH_DESKTOP_INSTALL = tmpInstall;
} else {
  delete process.env.DSH_DESKTOP_INSTALL;
}

const core = await import("../lib/core.js");

/** 壳入口在构建里的相对路径（官方布局换过：早期 lib/main.js，现在仍是 lib/main.js）。 */
function shellRelIn(entries) {
  for (const rel of ["lib/main.js", "main.js"]) {
    if (entries.has(rel)) return rel;
  }
  return "";
}

const asarIndex = asar ? readAsarIndex(path.resolve(asar)) : null;
let copied = 0;
let shellCopied = "";
const notFound = [];

if (asarIndex) {
  // 归档没解开：先用归档索引在临时树里铺一层 0 字节骨架，
  // 让补丁表的 firstExisting/allExisting 按真实布局解析出路径，再填真实内容。
  for (const rel of asarIndex.entries.keys()) {
    const dest = path.join(tmpApp, rel.replace(/\//g, path.sep));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.alloc(0));
  }
  const shellRel = shellRelIn(asarIndex.entries);
  const wanted = new Set();
  for (const value of Object.values(core.targetFiles(tmpAiBase, tmpHome))) {
    for (const fp of Array.isArray(value) ? value : [value]) {
      if (typeof fp !== "string" || !fp) continue;
      const rel = path.relative(tmpApp, fp).split(path.sep).join("/");
      if (rel.startsWith("..")) continue;
      if (asarIndex.entries.has(rel)) wanted.add(rel);
    }
  }
  if (shellRel) wanted.add(shellRel);
  for (const rel of wanted) {
    const entry = asarIndex.entries.get(rel);
    const size = Number(entry.size);
    const buf = Buffer.alloc(size);
    if (size > 0) fs.readSync(asarIndex.fd, buf, 0, size, asarIndex.dataStart + Number(entry.offset));
    fs.writeFileSync(path.join(tmpApp, rel.replace(/\//g, path.sep)), buf);
    copied += 1;
    if (rel === shellRel) shellCopied = rel;
  }
  fs.closeSync(asarIndex.fd);
} else {
  const files = core.targetFiles(realAiBase, tmpHome);
  const wanted = new Set();
  for (const value of Object.values(files)) {
    for (const fp of Array.isArray(value) ? value : [value]) {
      if (typeof fp === "string" && fp.startsWith(realAppDir + path.sep)) wanted.add(fp);
    }
  }
  // 壳入口：--app 指向已解开的 resources/app 时它就在 lib/main.js。
  for (const rel of ["lib/main.js", "main.js"]) {
    if (fs.existsSync(path.join(realAppDir, rel))) wanted.add(path.join(realAppDir, rel));
  }
  for (const abs of wanted) {
    const rel = abs.slice(realAppDir.length + 1);
    const src = path.join(realAppDir, rel);
    if (!fs.existsSync(src)) {
      notFound.push(rel);
      continue;
    }
    const dest = path.join(tmpApp, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied += 1;
    if (rel === "lib/main.js" || rel === "main.js") shellCopied = rel;
  }
}

const report = await core.applyPatches(tmpAiBase, core.ALL_PATCHES, {});
const byId = new Map(core.ALL_PATCHES.map((p) => [p.id, p]));
const bad = report.filter((r) => !core.isPatchResultSoftOk(r, byId.get(r.patch_id)));

console.log(`target: ${realAppDir}  surface: ${surface}`);
console.log(
  `copied ${copied} patch-target files${notFound.length ? `, ${notFound.length} not in this build` : ""}` +
    (surface === "desktop" ? `, shell: ${shellCopied || "not in this build"}` : ""),
);
for (const r of report.filter((r) => r.status !== "applied")) {
  console.log(`  ${r.status.padEnd(13)} #${String(r.patch_id).padEnd(2)} ${r.name}`);
}
const tally = report.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
console.log(`patches: ${core.ALL_PATCHES.length}  ${JSON.stringify(tally)}`);
if (jsonOut) fs.writeFileSync(path.resolve(jsonOut), JSON.stringify({ report, notFound, shell: shellCopied }, null, 2));

if (keep) {
  console.log(`\ntemp tree kept at ${tmpRoot}`);
} else {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

const pending = report.filter((r) => r.status === "pending" || r.status === "pattern_not_found");
if (pending.length) {
  console.log(`\nFAIL: ${pending.length} patch(es) still pending on this build.`);
  process.exit(1);
}
console.log(`\nOK: every applicable patch is settled (${bad.length} unexpected).`);
