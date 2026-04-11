"use client"

import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from "react"

// ─── Types ────────────────────────────────────────────────────────────────────
export type Theme = "dark" | "light" | "system"

interface ThemeContextValue {
  theme:         Theme          // préférence stockée ("dark" | "light" | "system")
  resolvedTheme: "dark"|"light" // thème réellement appliqué (system résolu)
  setTheme:      (t: Theme) => void
  toggle:        () => void     // bascule dark ↔ light directement
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeCtx = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error("useTheme must be inside <ThemeProvider>")
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")
  const [resolved, setResolved] = useState<"dark"|"light">("dark")

  // Lire la préférence stockée au montage
  useEffect(() => {
    const stored = (localStorage.getItem("alanya-theme") ?? "system") as Theme
    setThemeState(stored)
    applyTheme(stored)
  }, [])

  // Écouter les changements de préférence système
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => { if (theme === "system") applyTheme("system") }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  function applyTheme(t: Theme) {
    const isDark =
      t === "dark" ||
      (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

    const root = document.documentElement
    root.setAttribute("data-theme", isDark ? "dark" : "light")
    // Pour Tailwind dark mode (class strategy)
    if (isDark) root.classList.add("dark")
    else        root.classList.remove("dark")

    setResolved(isDark ? "dark" : "light")
  }

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem("alanya-theme", t)
    applyTheme(t)
  }

  function toggle() {
    const next = resolved === "dark" ? "light" : "dark"
    setTheme(next)
  }

  return (
    <ThemeCtx.Provider value={{ theme, resolvedTheme: resolved, setTheme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  )
}

// ─── Script d'initialisation (évite le flash de thème) ────────────────────────
// À insérer dans <head> AVANT tout autre script, dans app/layout.tsx :
//
//   <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
//
export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('alanya-theme') || 'system';
    var isDark = stored === 'dark' ||
      (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (isDark) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`
