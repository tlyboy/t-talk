# T-Talk

A modern instant messaging desktop application built with Tauri 2.0 + React 19 + Supabase.

## Features

- **Auth** - Email/password, GitHub OAuth, Cloudflare Turnstile
- **Chat** - Private & group chat with real-time messaging
- **Friends** - Search, add, manage friends with online status
- **Markdown** - Rich message rendering with code highlighting (Streamdown)
- **File Upload** - Client-side S3-compatible storage (R2, AWS S3, MinIO)
- **i18n** - Chinese & English with auto browser detection
- **Theme** - Dark/light/system with View Transition animation

## Tech Stack

- **Frontend** - React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend** - Supabase (Auth, Database, Realtime)
- **Desktop** - Tauri 2.0
- **Storage** - User-configured S3-compatible (client-side upload)

## Development

Requires [Rust](https://www.rust-lang.org/) and [Node.js 24](https://nodejs.org/).

```bash
pnpm install
pnpm tauri dev
```

## Build

```bash
pnpm tauri build
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values.

## License

[MIT](./LICENSE) © Guany
