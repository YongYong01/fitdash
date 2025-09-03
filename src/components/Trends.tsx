import React from 'react'
import { TrendingUp, Flame, Activity, BedDouble, Gauge } from 'lucide-react'
import { keyForDay, STORAGE_KEYS, addDays } from '../lib/utils'

type Num = number

function loadCaloriesIn(day: string): Num {
  try {
    const raw = localStorage.getItem(keyForDay(STORAGE_KEYS.foodLogPrefix, day))
    if (!raw) return 0
    const arr = JSON.parse(raw) as { calories: number; qty: number }[]
    return arr.reduce((s, x) => s + (x.calories || 0) * (x.qty || 0), 0)
  } catch { return 0 }
}

function loadExerciseMinutes(day: string): Num {
  try {
    const raw = localStorage.getItem(keyForDay(STORAGE_KEYS.exercisesPrefix, day))
    if (!raw) return 0
    const arr = JSON.parse(raw) as { minutes?: number }[]
    return arr.reduce((s, x) => s + (x.minutes || 0), 0)
  } catch { return 0 }
}

function loadSleepHours(day: string): Num {
  try {
    const mapRaw = localStorage.getItem(STORAGE_KEYS.sleepMap)
    if (!mapRaw) return 0
    const map = JSON.parse(mapRaw) as Record<string, number>
    return map[day] ?? 0
  } catch { return 0 }
}

function rangeDays(endInclusive: string, days: number) {
  // last `days` days ending at `endInclusive`
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) out.push(addDays(endInclusive, -i))
  return out
}

function avg(nums: Num[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

function diffColor(d: number) {
  if (d > 0) return 'text-emerald-400'
  if (d < 0) return 'text-rose-400'
  return 'text-slate-400'
}

function Diff({ label, value, unit }: { label: string; value: number; unit?: string }) {
  const c = diffColor(value)
  const sign = value > 0 ? '+' : value < 0 ? '–' : ''
  const mag = Math.abs(value)
  return (
    <div className={`text-xs ${c}`}>
      {label}: {sign}{unit ? `${mag.toFixed(0)} ${unit}` : mag.toFixed(2)}
    </div>
  )
}

export function Trends({ date }: { date: string }) {
  // Tunable burn rate for "Calories Out (Est.)"
  const [burnRate, setBurnRate] = React.useState<number>(() => {
    const raw = localStorage.getItem('fitdash_burn_rate_kcal_per_min')
    return raw ? Number(raw) : 6 // default 6 kcal/min
  })
  React.useEffect(() => {
    localStorage.setItem('fitdash_burn_rate_kcal_per_min', String(burnRate || 0))
  }, [burnRate])

  // Today values
  const cInToday = loadCaloriesIn(date)
  const exMinToday = loadExerciseMinutes(date)
  const cOutToday = exMinToday * (burnRate || 0)
  const sleepToday = loadSleepHours(date)

  // Yesterday values
  const y = addDays(date, -1)
  const cInY = loadCaloriesIn(y)
  const exMinY = loadExerciseMinutes(y)
  const cOutY = exMinY * (burnRate || 0)
  const sleepY = loadSleepHours(y)

  // Weekly windows
  const thisWeekDays = rangeDays(date, 7)
  const prevWeekEnd = addDays(date, -7)
  const prevWeekDays = rangeDays(prevWeekEnd, 7)

  const cInWeek = avg(thisWeekDays.map(loadCaloriesIn))
  const cInPrevWeek = avg(prevWeekDays.map(loadCaloriesIn))
  const exMinWeek = avg(thisWeekDays.map(loadExerciseMinutes))
  const exMinPrevWeek = avg(prevWeekDays.map(loadExerciseMinutes))
  const cOutWeek = exMinWeek * (burnRate || 0)
  const cOutPrevWeek = exMinPrevWeek * (burnRate || 0)
  const sleepWeek = avg(thisWeekDays.map(loadSleepHours))
  const sleepPrevWeek = avg(prevWeekDays.map(loadSleepHours))

  // Diffs
  const dDaily = {
    cIn: cInToday - cInY,
    cOut: cOutToday - cOutY,
    exMin: exMinToday - exMinY,
    sleep: sleepToday - sleepY,
  }
  const dWeekly = {
    cIn: cInWeek - cInPrevWeek,
    cOut: cOutWeek - cOutPrevWeek,
    exMin: exMinWeek - exMinPrevWeek,
    sleep: sleepWeek - sleepPrevWeek,
  }

  return (
    <div className="rounded-3xl bg-card ring-1 ring-border p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <div className="font-semibold">Trends</div>
          <div className="text-xs text-muted">Daily vs Yesterday • Weekly = rolling 7-day avg vs previous 7-day</div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Gauge className="w-4 h-4" />
          <span className="text-muted">Burn rate</span>
          <input
            type="number"
            min={0}
            className="input w-20"
            value={burnRate}
            onChange={(e) => setBurnRate(Number(e.target.value) || 0)}
          />
          <span className="text-muted">kcal / min</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        {/* Calories In */}
        <div className="rounded-2xl bg-surface ring-1 ring-border p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted">Calories In</div>
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-xl font-semibold">{Math.round(cInToday).toLocaleString()} kcal</div>
          <div className="mt-1 flex items-center justify-between">
            <Diff label="Daily" value={dDaily.cIn} unit="kcal" />
            <Diff label="Weekly" value={dWeekly.cIn} />
          </div>
        </div>

        {/* Calories Out (Est.) */}
        <div className="rounded-2xl bg-surface ring-1 ring-border p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted">Calories Out (Est.)</div>
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-xl font-semibold">{Math.round(cOutToday).toLocaleString()} kcal</div>
          <div className="mt-1 flex items-center justify-between">
            <Diff label="Daily" value={dDaily.cOut} unit="kcal" />
            <Diff label="Weekly" value={dWeekly.cOut} />
          </div>
          <div className="text-[11px] text-muted mt-1">Based on exercise minutes × burn rate</div>
        </div>

        {/* Exercise Minutes */}
        <div className="rounded-2xl bg-surface ring-1 ring-border p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted">Exercise Minutes</div>
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-xl font-semibold">{Math.round(exMinToday)} min</div>
          <div className="mt-1 flex items-center justify-between">
            <Diff label="Daily" value={dDaily.exMin} unit="min" />
            <Diff label="Weekly" value={dWeekly.exMin} />
          </div>
        </div>

        {/* Sleep */}
        <div className="rounded-2xl bg-surface ring-1 ring-border p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted">Sleep</div>
            <BedDouble className="w-4 h-4" />
          </div>
          <div className="text-xl font-semibold">{sleepToday.toFixed(2)} h</div>
          <div className="mt-1 flex items-center justify-between">
            <Diff label="Daily" value={dDaily.sleep} />
            <Diff label="Weekly" value={dWeekly.sleep} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Trends
