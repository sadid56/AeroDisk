export type ThemeMode = 'dark' | 'light' | 'system';

export const DEFAULT_FONTS = [
  'Inter',
  'system-ui',
  'JetBrains Mono',
  'Roboto',
  'Fira Code',
  'Segoe UI',
  'Cantarell',
  'Noto Sans',
  'Ubuntu',
  'Monospace',
  'Georgia',
  'Times New Roman',
];

export function applyThemeMode(mode: ThemeMode) {
  let isDark = mode === 'dark';
  if (mode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  const root = document.documentElement;

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  localStorage.setItem('hyperdisk_theme_mode', mode);
}

export function applyFont(fontFamily: string) {
  const fontStr = `"${fontFamily}", system-ui, -apple-system, sans-serif`;
  const root = document.documentElement;
  root.style.setProperty('--font-custom', fontStr);
  root.style.setProperty('--font-sans', fontStr);
  document.body.style.fontFamily = fontStr;
  localStorage.setItem('aerodisk_font', fontFamily);
}
