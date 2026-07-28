import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVersion } from '@tauri-apps/api/app';
import { Settings, Type, Palette, Check, Sun, Moon, Laptop } from "lucide-react";

export type ThemeMode = 'dark' | 'light' | 'system';

const DEFAULT_FONTS = [
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
    root.style.setProperty('--bg-color', '#09090b');
    root.style.setProperty('--surface-color', '#121217');
    root.style.setProperty('--surface-hover-color', '#1a1a23');
    root.style.setProperty('--surface-border-color', '#242432');
    root.style.setProperty('--text-color', '#f1f5f9');
    root.style.setProperty('--text-primary', '#f8fafc');
    root.style.setProperty('--text-secondary', '#cbd5e1');
    root.style.setProperty('--text-muted', '#94a3b8');
    root.style.setProperty('--accent-purple-color', '#8b5cf6');
    root.style.setProperty('--accent-blue-color', '#3b82f6');
  } else {
    root.style.setProperty('--bg-color', '#ffffff');
    root.style.setProperty('--surface-color', '#f8fafc');
    root.style.setProperty('--surface-hover-color', '#f1f5f9');
    root.style.setProperty('--surface-border-color', '#cbd5e1');
    root.style.setProperty('--text-color', '#0f172a');
    root.style.setProperty('--text-primary', '#020617');
    root.style.setProperty('--text-secondary', '#334155');
    root.style.setProperty('--text-muted', '#64748b');
    root.style.setProperty('--accent-purple-color', '#7c3aed');
    root.style.setProperty('--accent-blue-color', '#2563eb');
  }

  localStorage.setItem('aerodisk_theme_mode', mode);
}

export function applyFont(fontFamily: string) {
  const fontStr = `"${fontFamily}", system-ui, -apple-system, sans-serif`;
  const root = document.documentElement;
  root.style.setProperty('--font-custom', fontStr);
  root.style.setProperty('--font-sans', fontStr);
  document.body.style.fontFamily = fontStr;
  localStorage.setItem('aerodisk_font', fontFamily);
}

interface SettingsPageProps {
  onBackToAnalyzer: () => void;
}
export const SettingsPage: React.FC<SettingsPageProps> = React.memo(() => {
  const navigate = useNavigate();
  const [selectedFont, setSelectedFont] = useState<string>("Inter");
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [systemFonts, setSystemFonts] = useState<string[]>(DEFAULT_FONTS);
  const [appVersion, setAppVersion] = useState<string>("2.0.0");

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const ver = await getVersion();
        setAppVersion(ver);
      } catch (err) {
        console.warn("Failed to fetch version:", err);
      }
    };
    fetchVersion();
  }, []);

  useEffect(() => {
    const savedFont = localStorage.getItem("aerodisk_font");
    const savedMode = (localStorage.getItem("aerodisk_theme_mode") as ThemeMode) || "dark";

    if (savedFont) {
      setSelectedFont(savedFont);
      applyFont(savedFont);
    }

    setThemeMode(savedMode);
    applyThemeMode(savedMode);

    fetchSystemFonts();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentMode = (localStorage.getItem("aerodisk_theme_mode") as ThemeMode) || "dark";
      if (currentMode === "system") {
        applyThemeMode("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const fetchSystemFonts = async () => {
    try {
      if ("queryLocalFonts" in window) {
        const fontData = await (window as any).queryLocalFonts();
        const fontFamilies: string[] = Array.from(new Set(fontData.map((f: any) => f.family)));
        if (fontFamilies.length > 0) {
          setSystemFonts(Array.from(new Set([...DEFAULT_FONTS, ...fontFamilies])));
        }
      }
    } catch (err) {
      console.warn("Local font access query failed:", err);
    }
  };

  const handleFontChange = useCallback((font: string) => {
    setSelectedFont(font);
    applyFont(font);
  }, []);

  const handleThemeChange = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    applyThemeMode(mode);
  }, []);

  const themeOptions: { mode: ThemeMode; label: string; icon: any; desc: string }[] = [
    {
      mode: "dark",
      label: "Dark Mode",
      icon: Moon,
      desc: "Dark charcoal background with vibrant violet accents",
    },
    {
      mode: "light",
      label: "Light / White Mode",
      icon: Sun,
      desc: "Pure white background with high-contrast slate text",
    },
    {
      mode: "system",
      label: "System Default",
      icon: Laptop,
      desc: "Automatically syncs with your OS light/dark preference",
    },
  ];

  return (
    <div className='flex-1 overflow-y-auto bg-background bg-glow p-6 sm:p-10 select-none'>
      <div className='max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-150'>
        <div className='flex items-center justify-between border-b border-surface-border pb-6'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-3'>
              <Settings className='w-5 h-5' />
              <h1 className='text-xl font-bold'>Settings & Configuration</h1>
            </div>
          </div>
        </div>

        <section className='bg-surface/60 border border-surface-border rounded-2xl p-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <Palette className='w-5 h-5' />
              <div>
                <h2 className='text-sm font-bold'>Change Theme</h2>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2'>
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themeMode === opt.mode;

              return (
                <button
                  key={opt.mode}
                  onClick={() => handleThemeChange(opt.mode)}
                  className={`p-5 rounded-2xl border text-xs text-left transition-all flex flex-col justify-between gap-4 cursor-pointer bg-background/60 border-surface-border hover:bg-surface-hover hover:border-slate-500
                  `}
                >
                  <div className='flex items-center justify-between w-full'>
                    <div className='w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center'>
                      <Icon className='w-5 h-5' />
                    </div>
                    {isSelected && <Check className='w-5 h-5 shrink-0' />}
                  </div>

                  <div>
                    <h3 className='font-bold text-sm block'>{opt.label}</h3>
                    <p className='text-[11px] opacity-70 mt-1 leading-relaxed'>{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className='bg-surface/60 border border-surface-border rounded-2xl p-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <Type className='w-5 h-5' />
              <h2 className='text-sm font-bold'>Typography & System Fonts</h2>
            </div>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-surface-border'>
            {systemFonts.map((font) => {
              const isSelected = selectedFont === font;
              return (
                <button
                  key={font}
                  onClick={() => handleFontChange(font)}
                  style={{ fontFamily: `"${font}", system-ui, sans-serif` }}
                  className={`p-3 rounded-xl border text-xs font-medium text-left truncate transition-all flex items-center justify-between cursor-pointer bg-background/60 border-surface-border hover:bg-surface-hover hover:border-slate-500`}
                >
                  <span className='truncate'>{font}</span>
                  {isSelected && <Check className='w-5 h-5  shrink-0' />}
                </button>
              );
            })}
          </div>
        </section>

        <section className='bg-surface/60 border border-surface-border rounded-2xl p-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <Settings className='w-5 h-5 text-accent-purple' />
              <h2 className='text-sm font-bold'>System & Updates</h2>
            </div>
          </div>

          <div className='p-4 bg-background/40 border border-surface-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div>
              <h3 className='font-bold text-xs text-text-primary'>Current Version: v{appVersion}</h3>
              <p className='text-[10px] text-text-muted mt-0.5'>Check release status and manage download parameters</p>
            </div>
            <button
              onClick={() => navigate('/updates')}
              className='px-4 py-2 rounded-xl border border-surface-border bg-background hover:bg-surface-hover text-xs font-bold text-text-secondary hover:text-text-primary transition-all cursor-pointer'
            >
              Check & Manage Updates
            </button>
          </div>
        </section>
      </div>
    </div>
  );
});
