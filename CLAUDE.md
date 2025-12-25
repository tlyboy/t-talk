# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

T-Talk 是一个使用 Tauri 2 + Vue 3 构建的桌面聊天应用，支持 AI 文本润色功能。

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式（仅前端）
pnpm dev

# 开发模式（Tauri 桌面应用）
pnpm tauri dev

# 构建前端
pnpm build

# 构建桌面应用
pnpm tauri build
```

## 技术架构

### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite (使用 rolldown-vite)
- **状态管理**: Pinia + pinia-plugin-persistedstate（持久化存储）
- **UI 组件**: Element Plus（中文配置）
- **样式**: TailwindCSS 4 + SCSS
- **图标**: @egoist/tailwindcss-icons (Carbon 图标集)
- **Markdown 渲染**: markdown-it + Shiki 代码高亮

### 桌面端
- **框架**: Tauri 2
- **开发端口**: 1420

### 自动导入配置
项目使用 unplugin 系列插件实现自动导入：
- **unplugin-vue-router**: 基于文件的路由 (`src/pages/` 目录)
- **unplugin-auto-import**: 自动导入 Vue/VueUse/Pinia API 和 `src/composables/`、`src/stores/` 目录
- **unplugin-vue-components**: 自动导入组件和 Element Plus
- **vite-plugin-vue-layouts**: 布局系统 (`src/layouts/` 目录)

### 目录结构关键点
- `src/pages/` - 基于文件的路由页面
- `src/layouts/` - 页面布局组件
- `src/stores/` - Pinia stores（自动导入）
- `src/api/` - API 请求模块
- `src/utils/request.ts` - Axios 请求封装
- `src-tauri/` - Tauri Rust 后端代码

### 路由守卫
路由白名单：`/login`、`/register`、`/settings`，其他页面需要用户 token 认证。

### API 配置
在 `src/stores/settings.ts` 中配置：
- `url` - 后端 API 地址
- `wsUrl` - WebSocket 地址
- `baseUrl` - AI 模型 API 地址（默认 Ollama）
- `apiKey` / `model` - AI 模型配置
