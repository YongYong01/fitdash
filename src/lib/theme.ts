export type ThemeName = 'dark' | 'light'
export type AccentName = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose'

const ACCENTS: Record<AccentName, string> = {
  emerald: '#34d399', sky: '#38bdf8', violet: '#8b5cf6', amber: '#f59e0b', rose: '#f43f5e',
}

export function applyTheme(theme: ThemeName, accent: AccentName) {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.setProperty('--accent', ACCENTS[accent])
}
