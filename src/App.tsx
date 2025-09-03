import React from 'react'
import { motion } from 'framer-motion'
import { Dumbbell, TimerReset } from 'lucide-react'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { XPBadge } from './components/XPBadge'
import { Exercises } from './components/Exercises'
import { Food } from './components/Food'
import { Sleep } from './components/Sleep'
import { DateBar } from './components/DateBar'
import { STORAGE_KEYS, todayISO } from './lib/utils'
import { Trends } from './components/Trends'
import { Progress } from './components/Progress' // <-- NEW
import { BodyWeight } from './components/BodyWeight'


function awardXP(amount:number){
  const cur = Number(localStorage.getItem(STORAGE_KEYS.xp)||0)
  const next = cur + amount
  localStorage.setItem(STORAGE_KEYS.xp, String(next))
  return next
}
function touchDailyStreak(){
  const today = todayISO()
  const last = localStorage.getItem(STORAGE_KEYS.lastActiveDay)
  let s = Number(localStorage.getItem(STORAGE_KEYS.streak) || 0)
  if (last === today) return s
  const y = new Date(); y.setDate(y.getDate()-1)
  const yISO = y.toISOString().slice(0,10)
  s = last === yISO ? s+1 : 1
  localStorage.setItem(STORAGE_KEYS.streak, String(s))
  localStorage.setItem(STORAGE_KEYS.lastActiveDay, today)
  return s
}

export default function App(){
  const [xp, setXp] = React.useState<number>(()=> Number(localStorage.getItem(STORAGE_KEYS.xp)||0))
  const [streak, setStreak] = React.useState<number>(()=> Number(localStorage.getItem(STORAGE_KEYS.streak)||0))
  const [date, setDate] = React.useState<string>(todayISO())

  // NEW: tab state ('dashboard' | 'progress')
  const [tab, setTab] = React.useState<'dashboard'|'progress'>('dashboard')

  const onXP = (n:number)=> setXp(awardXP(n))
  const onStreak = ()=> setStreak(touchDailyStreak())

  const hardResetDay = ()=>{
    // Remove just this day’s logs
    localStorage.removeItem(`${STORAGE_KEYS.exercisesPrefix}${date}`)
    localStorage.removeItem(`${STORAGE_KEYS.foodLogPrefix}${date}`)
    // Targets are kept
    location.reload()
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--bg-950), var(--bg-900), var(--bg-1000))', color: 'var(--fg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ backdropFilter:'blur(8px)', background:'color-mix(in hsl, var(--bg-900) 60%, transparent)', borderBottom:'1px solid var(--border)' }}>
        <div className="container py-3 sm:py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <motion.div initial={{ rotate: -20, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring' }} className="p-2 rounded-2xl bg-card ring-1 ring-border shrink-0">
              <Dumbbell className="w-5 h-5" />
            </motion.div>
            <div className="truncate">
              <h1 className="text-lg sm:text-2xl font-semibold tracking-tight truncate">Fitness Dashboard</h1>
              <span className="hidden sm:inline text-muted">· Track • Fuel • Sleep</span>
            </div>
          </div>

          <DateBar date={date} onChange={setDate} />

<BodyWeight date={date} />

<div className="flex items-center gap-2 flex-wrap justify-end">
  <ThemeSwitcher />
  <XPBadge xp={xp} streak={streak} />
  <button onClick={hardResetDay} className="btn-secondary inline-flex items-center gap-2">
    <TimerReset className="w-4 h-4"/> Reset day
  </button>
</div>

        </div>
      </header>

      {/* NEW: Tab bar */}
      <div className="container mt-3">
        <div className="inline-flex rounded-2xl ring-1 ring-border overflow-hidden bg-card">
          <button
            onClick={()=>setTab('dashboard')}
            className={`px-4 py-2 text-sm ${tab==='dashboard' ? 'bg-surface text-fg' : 'text-muted hover:text-fg'}`}
          >
            Dashboard
          </button>
          <button
            onClick={()=>setTab('progress')}
            className={`px-4 py-2 text-sm ${tab==='progress' ? 'bg-surface text-fg' : 'text-muted hover:text-fg'}`}
          >
            Progress
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'dashboard' ? (
        <>
          <div className="container mt-4">
            <Trends date={date} />
          </div>
          <main className="container py-4 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <section className="lg:col-span-1"><Exercises date={date} onXP={onXP} onStreak={onStreak}/></section>
            <section className="lg:col-span-1"><Food date={date} onXP={onXP} onStreak={onStreak}/></section>
            <section className="lg:col-span-1"><Sleep date={date} onXP={onXP} onStreak={onStreak}/></section>
          </main>
        </>
      ) : (
        <main className="container py-4">
          {/* Progress page shows charts (body weight, sleep, exercise selection) */}
          <Progress />
        </main>
      )}

      <footer className="container pb-10 text-center text-xs text-muted">
        Your data stays in your browser (localStorage). Use the date bar to edit any day.
      </footer>
    </div>
  )
}
