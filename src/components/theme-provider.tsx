import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from "react"

// ─── Types ────────────────────────────────────────────────────────────────────
export type Theme = "dark" | "light" | "system"
export type Palette = "default" | "soft"

interface ThemeContextValue {
  theme:         Theme          // préférence stockée ("dark" | "light" | "system")
  resolvedTheme: "dark"|"light" // thème réellement appliqué (system résolu)
  palette:       Palette
  setTheme:      (t: Theme) => void
  togglePalette: () => void
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
  const [palette, setPaletteState] = useState<Palette>("default")

  // Lire la préférence stockée au montage
  useEffect(() => {
    const stored = (localStorage.getItem("alanya-theme") ?? "system") as Theme
    const storedPalette = (localStorage.getItem("alanya-palette") ?? "default") as Palette
    setThemeState(stored)
    setPalette(storedPalette === "soft" ? "soft" : "default")
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

  function setPalette(next: Palette) {
    const paletteValue = next === "soft" ? "soft" : "default"
    setPaletteState(paletteValue)
    localStorage.setItem("alanya-palette", paletteValue)
    document.documentElement.setAttribute("data-palette", paletteValue)
  }

  function toggle() {
    const next = resolved === "dark" ? "light" : "dark"
    setTheme(next)
  }

  function togglePalette() {
    setPalette(palette === "soft" ? "default" : "soft")
  }

  return (
    <ThemeCtx.Provider value={{ theme, resolvedTheme: resolved, palette, setTheme, toggle, togglePalette }}>
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
    var palette = localStorage.getItem('alanya-palette') || 'default';
    var isDark = stored === 'dark' ||
      (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-palette', palette === 'soft' ? 'soft' : 'default');
    if (isDark) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`
