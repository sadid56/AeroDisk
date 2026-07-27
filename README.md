# AeroDisk — High Performance Disk Usage Analyzer

<p align="center">
  <b>AeroDisk</b> is a lightning-fast, high-performance, cross-platform disk space and storage analyzer built with <b>Rust</b>, <b>Tauri v2</b>, <b>Vite</b>, <b>React</b>, <b>TypeScript</b>, <b>Tailwind CSS</b>, and <b>pnpm</b>.
</p>

---

## ⚡ Key Features

- **Blazing Fast Multithreaded Scanning**: Powered by a multi-threaded Rust backend engine capable of indexing tens of thousands of files per second.
- **Interactive Sunburst Visualization**: High-DPI HTML5 Canvas Sunburst chart rendering directory hierarchies with interactive HSL color accents, hover inspection, and drill-down navigation.
- **Native Cross-Platform System Integration**: Real-time storage space reports, native file manager revealing (Explorer / Finder / Nautilus), and safe Trash deletion via system APIs.
- **Modern Dark UI**: Glassmorphic UI styled with Tailwind CSS, custom breadcrumb navigation, live search filtering, and responsive design.

---

## 🛠️ Tech Stack

- **Frontend Core**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Backend & Native System**: [Rust](https://www.rust-lang.org/), [Tauri v2](https://tauri.app/)
- **Package Managers**: [pnpm](https://pnpm.io/), [cargo](https://doc.rust-lang.org/cargo/)

---

## 📂 Project Folder Structure

```
AeroDisk/
├── src-tauri/                   # Rust Tauri backend
│   ├── Cargo.toml               # Cargo package & dependencies manifest
│   ├── tauri.conf.json          # Tauri application configuration
│   ├── build.rs                 # Tauri build script
│   ├── icons/                   # App icons for Windows, macOS, Linux
│   └── src/
│       ├── main.rs              # App entry point
│       ├── lib.rs               # Library entry point & Tauri command registration
│       ├── scanner.rs           # Multi-threaded parallel directory scanner
│       ├── disk.rs              # Native disk storage query engine
│       └── trash.rs             # Cross-platform safe trash deletion & reveal
├── src/                         # React Frontend
│   ├── assets/                  # Graphics & static assets
│   ├── components/              # React UI components
│   │   ├── BreadcrumbNav.tsx
│   │   ├── ContextMenu.tsx
│   │   ├── DeleteModal.tsx
│   │   ├── FileList.tsx
│   │   ├── FocusCard.tsx
│   │   ├── Header.tsx
│   │   ├── StorageOverview.tsx
│   │   ├── SunburstChart.tsx
│   │   └── Toast.tsx
│   ├── hooks/                   # React custom hooks (IPC connection)
│   │   ├── useDiskInfo.ts
│   │   └── useScanner.ts
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Formatting utilities
│   ├── App.tsx                  # Root application component
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global Tailwind CSS directives
├── index.html                   # HTML template
├── package.json                 # Node dependencies & pnpm scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Rust](https://www.rust-lang.org/) (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)

### Installation & Development

```bash
# 1. Clone the repository
git clone https://github.com/sadid56/AeroDisk.git
cd AeroDisk

# 2. Install frontend dependencies with pnpm
pnpm install

# 3. Start development server with Tauri
export PATH="$HOME/.cargo/bin:$PATH"
pnpm tauri dev
```

### Building for Production

```bash
# Run TypeScript check
pnpm check

# Build production app bundle for desktop (macOS DMG, Windows NSIS, Linux AppImage/deb/rpm)
export PATH="$HOME/.cargo/bin:$PATH"
pnpm tauri build
```

---

## 📜 License

[MIT](LICENSE) © [Sadid](https://github.com/sadid56)
