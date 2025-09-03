import React from 'react'
import { Palette } from 'lucide-react'
import { applyTheme, ThemeName, AccentName } from '../lib/theme'
import { STORAGE_KEYS } from '../lib/utils'

export function ThemeSwitcher(){
  const [theme, setTheme] = React.useState<ThemeName>(() => (localStorage.getItem(STORAGE_KEYS.theme) as ThemeName) || 'dark')
  const [accent, setAccent] = React.useState<AccentName>(() => (localStorage.getItem(STORAGE_KEYS.accent) as AccentName) || 'emerald')
  React.useEffect(()=>{ applyTheme(theme, accent); localStorage.setItem(STORAGE_KEYS.theme, theme); localStorage.setItem(STORAGE_KEYS.accent, accent) },[theme,accent])
  return (
    <div className="inline-flex items-center gap-2 rounded-xl px-2 py-1 ring-1 ring-border bg-card">
      <Palette className="w-4 h-4"/>
      <select className="input !px-2 !py-1 w-[5.5rem]" value={theme} onChange={e=>setTheme(e.target.value as ThemeName)}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
      <select className="input !px-2 !py-1" value={accent} onChange={e=>setAccent(e.target.value as AccentName)}>
        <option value="emerald">Emerald</option>
        <option value="sky">Sky</option>
        <option value="violet">Violet</option>
        <option value="amber">Amber</option>
        <option value="rose">Rose</option>
      </select>
    </div>
  )
}
