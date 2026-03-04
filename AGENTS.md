# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

T-Talk is a desktop chat application built with Tauri 2 + Vue 3, featuring AI text polishing capabilities.

## Common Commands

```bash
# Install dependencies
pnpm install

# Development mode (frontend only)
pnpm dev

# Development mode (Tauri desktop app)
pnpm tauri dev

# Build frontend
pnpm build

# Build desktop app
pnpm tauri build
```

## Technical Architecture

### Frontend Tech Stack

- **Framework**: Vue 3 + TypeScript
- **Build Tool**: Vite (using rolldown-vite)
- **State Management**: Pinia + pinia-plugin-persistedstate (persisted storage)
- **UI Components**: Element Plus (Chinese locale configuration)
- **Styling**: TailwindCSS 4 + SCSS
- **Icons**: @egoist/tailwindcss-icons (Carbon icon set)
- **Markdown Rendering**: markdown-it + Shiki code highlighting

### Desktop

- **Framework**: Tauri 2
- **Dev Port**: 1420

### Auto-Import Configuration

The project uses unplugin series plugins for auto-imports:

- **unplugin-vue-router**: File-based routing (`src/pages/` directory)
- **unplugin-auto-import**: Auto-imports Vue/VueUse/Pinia APIs and `src/composables/`, `src/stores/` directories
- **unplugin-vue-components**: Auto-imports components and Element Plus
- **vite-plugin-vue-layouts**: Layout system (`src/layouts/` directory)

### Key Directory Structure

- `src/pages/` - File-based routing pages
- `src/layouts/` - Page layout components
- `src/stores/` - Pinia stores (auto-imported)
- `src/api/` - API request modules
- `src/utils/request.ts` - Axios request wrapper
- `src-tauri/` - Tauri Rust backend code

### Route Guards

Route whitelist: `/login`, `/register`, `/settings`. Other pages require user token authentication.

### API Configuration

Configured in `src/stores/settings.ts`:

- `url` - Backend API address
- `wsUrl` - WebSocket address
- `baseUrl` - AI model API address (default: Ollama)
- `apiKey` / `model` - AI model configuration
