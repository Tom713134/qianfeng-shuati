<h1 align="center">前锋刷题软件 / Qianfeng Shuati</h1>

<p align="center">
  解压即用的 Windows 选择题练习。导入 Markdown / JSON，错题本，可打乱选项。<br>
  不用注册，数据只在你的电脑上。
</p>

<p align="center">
  <img alt="MIT" src="https://img.shields.io/badge/license-MIT-0f6e62" />
  <img alt="Windows" src="https://img.shields.io/badge/Windows-10%2F11-1a2420" />
  <img alt="No account" src="https://img.shields.io/badge/account-not%20required-e0b15a" />
</p>

<p align="center">
  <a href="怎么用.html">怎么用</a>
  ·
  <a href="#online-demo">在线演示</a>
  ·
  <a href="../../releases/latest">下载</a>
  ·
  <a href="#english">English</a>
  ·
  <a href="LICENSE">MIT</a>
</p>

<p align="center">
  <img src="docs/screenshots/quiz.png" alt="前锋刷题软件主界面：侧边栏题库和选择题" width="920" />
</p>

## 功能

- 导入 JSON、Markdown、CSV、纯文本试卷
- 单选 / 多选，做错收入错题本
- 打乱题序、打乱选项（解析会跟当前选项对齐）
- 进度保存在本机，下次打开还在
- 可选：填自己的 API Key（DeepSeek / OpenAI / Ollama）生成解析

不填 Key 也能完整刷题。

<p align="center">
  <img src="docs/screenshots/result.png" alt="答对后显示解析" width="920" />
</p>

<h2 id="online-demo">试用</h2>

打开本仓库的 **GitHub Pages**（仓库右侧 About 的 Website）即可在浏览器里刷示例题，不用安装。第一次会载入「计算机基础」示例。

网页版进度只存在当前浏览器。要导入自己的试卷、并让进度跟着 Windows 配置走，请用下面的绿色版。

## Windows 打开

1. [下载 Releases 里的 zip](../../releases/latest)（或克隆本仓库）
2. 解压后**保留整个文件夹**
3. 双击带图标的 **前锋刷题**；没有图标时双击 `打开前锋刷题.vbs` 或 `前锋刷题.bat`

需要 Windows 10/11，以及 Edge 或 Chrome。不必安装 Node 或其他运行时。

从 QQ / 微信 / 网盘下载后，若提示「Windows 已保护你的电脑」：点 **更多信息 → 仍要运行**。或右键 `打开前锋刷题.vbs` → 属性 → **解除锁定**。

更完整的说明见 [怎么用.html](怎么用.html)。

## 导入题库

打开后把文件拖进窗口，或用侧边栏「导入题库」。支持 JSON、Markdown、CSV 和纯文本。

<p align="center">
  <img src="docs/screenshots/import.png" alt="导入题库对话框，可粘贴文本或选择文件" width="920" />
</p>

仓库只带示例，用来确认导入是否正常：

- [`题库/sample-questions.json`](题库/sample-questions.json)
- [`题库/sample-questions.txt`](题库/sample-questions.txt)

自己的试卷请自行导入，不要把课内卷提交进本仓库。

## 数据存在哪

做题记录、导入的题库、API Key 都在这台电脑上：

- 浏览器配置：`%APPDATA%\前锋刷题软件`
- 关掉窗口即退出，没有后台服务

若本机以前用过旧版「刷题」，第一次打开会自动沿用原来的进度。

换电脑时先在软件里「导出题库」。进度目前跟这台电脑绑定。

## 开发

```text
qianfeng-shuati/
  index.html              页面
  app.js                  逻辑（含导入解析）
  styles.css              样式
  server.ps1              本机静态服务 + API 代理
  打开前锋刷题.vbs / 前锋刷题.bat   启动
  题库/                    仅示例题
  docs/                    README 截图与社交预览图
```

在仓库根目录双击启动即可。`app.js` 可用 Node 跑自检：

```bat
node app.js --test
```

GitHub Pages 由 `.github/workflows/pages.yml` 在推送到 `main` 后发布。打 `v*` 标签会打包 Windows zip 到 Releases。

<h2 id="english">English</h2>

**Qianfeng Shuati** is a portable Windows quiz app for multiple-choice practice. Import JSON / Markdown / CSV / text, review missed questions, optionally shuffle stems and options. Progress stays on this computer. No account.

<p align="center">
  <img src="docs/screenshots/quiz.png" alt="Qianfeng Shuati quiz screen" width="920" />
</p>

**Try in the browser:** the GitHub Pages site (Website in the repo About). Sample questions load on first visit.

**Run on Windows:** unzip the folder from [Releases](../../releases/latest), then double-click `打开前锋刷题.vbs` or `前锋刷题.bat`. Windows 10/11 with Edge or Chrome.

If SmartScreen says Windows protected your PC: **More info → Run anyway**, or unblock the `.vbs` / `.bat` from Properties.

Sample banks are in `题库/`. Do not commit copyrighted course exams.

MIT licensed. See [怎么用.html](怎么用.html) for the Chinese walkthrough.
