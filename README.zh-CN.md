# T-Talk

基于 Tauri 2.0 + React 19 + Supabase 构建的现代即时通讯桌面应用。

## 功能

- **认证** - 邮箱密码登录、GitHub OAuth、Cloudflare Turnstile 人机验证
- **聊天** - 私聊和群聊，实时消息推送
- **好友** - 搜索、添加、管理好友，在线状态显示
- **Markdown** - 富文本消息渲染，代码高亮 (Streamdown)
- **文件上传** - 客户端直传 S3 兼容存储（R2、AWS S3、MinIO）
- **国际化** - 中文和英文，自动检测浏览器语言
- **主题** - 深色/浅色/跟随系统，View Transition 切换动画

## 技术栈

- **前端** - React 19、TypeScript、Tailwind CSS 4、shadcn/ui
- **后端** - Supabase（Auth、Database、Realtime）
- **桌面端** - Tauri 2.0
- **存储** - 用户自行配置 S3 兼容存储（客户端直传）

## 开发

需要安装 [Rust](https://www.rust-lang.org/) 和 [Node.js 24](https://nodejs.org/)。

```bash
pnpm install
pnpm tauri dev
```

## 构建

```bash
pnpm tauri build
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填入你的配置。

## 许可证

[MIT](./LICENSE) © Guany
