# T-Talk

🚀 **T-Talk** 是一个基于 Tauri + Vue 3 + TypeScript 的跨平台 Markdown 聊天工具，致力于带来极致的桌面聊天与 Markdown 富文本体验。

> ⚠️ 当前项目仍在开发中，欢迎关注和参与！

## 项目简介

T-Talk 旨在为用户提供一个支持 Markdown 语法的聊天环境，兼具美观、响应式、跨平台等特性。
未来将支持消息实时渲染、主题切换、文件管理等功能。

## 特性

- 💬 支持 Markdown 格式的聊天消息
- 🖥️ 基于 Tauri，轻量高性能，跨平台（Windows/macOS/Linux）
- ⚡ 极速 Vite 构建，热更新体验极佳
- 🎨 Vue 3 + TypeScript 现代化开发体验
- 🌈 集成 Tailwind CSS，支持自定义主题
- 🗃️ 状态管理集成 Pinia，支持持久化
- 📱 响应式设计，兼容桌面与移动端
- 🚀 一键打包发布

## 快速开始

1. 克隆项目：

   ```bash
   git clone https://github.com/tlyboy/t-talk.git
   cd t-talk
   ```

2. 安装依赖：

   ```bash
   pnpm install
   ```

3. 本地开发（Web 端预览）：

   ```bash
   pnpm dev
   ```

4. 启动 Tauri 桌面应用开发模式：

   ```bash
   pnpm tauri dev
   ```

5. 构建生产包（Web）：

   ```bash
   pnpm build
   ```

6. 打包桌面应用（Tauri）：

   ```bash
   pnpm tauri build
   ```

## 目录结构

```
├── src/
│   ├── components/    # 组件（如 DarkToggle）
│   ├── layouts/       # 页面布局
│   ├── pages/         # 页面（index、settings、user）
│   ├── router/        # 路由配置
│   ├── styles.css     # 全局样式
│   └── main.ts        # 应用入口
├── public/            # 静态资源
├── src-tauri/         # Tauri 后端（Rust 代码）
│   ├── src/           # Rust 主入口
│   ├── icons/         # 应用图标
│   └── tauri.conf.json# Tauri 配置
├── package.json
├── vite.config.ts
├── tauri.conf.json
└── ...
```

## 环境要求

- Node.js 22.x
- pnpm 10.6.2 及以上
- Rust 环境（Tauri 依赖，详见 [Tauri 安装文档](https://tauri.app/zh-cn/start/prerequisites/)）

## 进度与计划

- [x] 项目初始化与基础架构
- [ ] Markdown 聊天消息输入与渲染
- [ ] 聊天记录持久化
- [ ] 多主题/暗色模式
- [ ] 文件/图片发送
- [ ] 多端同步

> 欢迎 Issue/PR 参与共建！

## 许可协议

[MIT](LICENSE) © Guany
