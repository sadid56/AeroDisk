# AeroDisk Architecture

## Overview

AeroDisk is a desktop application composed of a React frontend and a Rust backend connected through Tauri. The frontend handles user interaction, display, and scanning state, while the backend performs fast, native file system scanning and system integration.

## Frontend

- Located in `src/`.
- Built with React, TypeScript, and Tailwind CSS.
- Key responsibilities:
  - Render the main analyzer UI and welcome dashboard.
  - Manage scan state and search filtering.
  - Present storage results through charts and lists.
  - Send IPC requests to the Rust backend and consume scan progress events.

### Important frontend modules

- `src/App.tsx` — Root application component, manages global state and routes.
- `src/routes/AppRoutes.tsx` — Defines page routing and passes scan state into pages.
- `src/components/WelcomeDashboard.tsx` — Starting view for selecting scans.
- `src/components/FileList.tsx` — Displays scanned file and folder details.
- `src/components/SunburstChart.tsx` — Visualizes storage usage.
- `src/hooks/useScanner.ts` — Manages live scan state, progress updates, and IPC subscriptions.
- `src/hooks/useDiskInfo.ts` — Queries disk capacity and refreshes drive statistics.

## Backend

- Located in `src-tauri/src/`.
- Written in Rust and managed with Cargo.
- Key responsibilities:
  - Perform efficient directory scanning.
  - Emit streaming scan updates to the frontend.
  - Provide system features like reveal-in-file-manager and safe trash deletion.

### Important backend modules

- `src-tauri/src/main.rs` — Tauri app entry point and command registration.
- `src-tauri/src/lib.rs` — Common command definitions and application setup.
- `src-tauri/src/scanner.rs` — Native scanner logic with batch updates and error handling.
- `src-tauri/src/disk.rs` — Disk information retrieval.
- `src-tauri/src/trash.rs` — Manage safe deletion and system reveal operations.

## IPC and Scan Workflow

- The frontend requests scans via a Tauri command.
- The backend scans directories natively and streams progress through events.
- Progress events include item counts, path updates, and scan completion status.
- The frontend receives these updates and incrementally updates the UI, enabling live feedback during scanning.

## Production Build Flow

1. Frontend build:
   - `pnpm build` compiles the React app using Vite and emits static assets into `dist/`.
2. Tauri packaging:
   - `pnpm tauri build` packages the frontend assets with the Rust backend into a desktop application.
3. Configuration:
   - `src-tauri/tauri.conf.json` defines the application window, bundle settings, and native behavior.
   - `src-tauri/Cargo.toml` defines Rust dependencies and package metadata.

## Key Configuration Files

- `package.json` — Node scripts, frontend dependencies, and Tauri build commands.
- `tsconfig.json` — TypeScript compiler settings.
- `vite.config.ts` — Vite build and development settings.
- `src-tauri/tauri.conf.json` — Tauri application configuration.
- `src-tauri/Cargo.toml` — Rust package configuration.

## Contribution Focus Areas

- Improve scan performance and incremental rendering.
- Enhance chart interactions and file navigation.
- Harden file system error handling and permission fallback.
- Polish application styling and accessibility.
