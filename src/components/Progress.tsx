// src/components/Progress.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from 'recharts'
import { Card, CardHeader } from './UI'
import { STORAGE_KEYS, ExerciseItem } from '../lib/utils'

type Granularity = 'daily' | 'monthly' | 'yearly'
type SeriesPoint = { date: string; value: number }

// -------- helpers
const loadJSON = <T,>(key: string, fallback: T): T => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}

function monthKey(iso: string) { return iso.slice(0, 7) } // YYYY-MM
function yearKey(iso: string) { return iso.slice(0, 4) }  // YYYY

function aggregate(points: SeriesPoint[], granularity: Granularity): SeriesPoint[] {
  if (granularity === 'daily') {
    return [...points].sort((a,b)=>a.date.localeCompare(b.date))
  }
  const map = new Map<string, { sum: number; count: number }>()
  const keyFn = granularity === 'monthly' ? monthKey : yearKey
  for (const p of points) {
    const k = keyFn(p.date)
    const cur = map.get(k) || { sum: 0, count: 0 }
    cur.sum += p.value
    cur.count += 1
    map.set(k, cur)
  }
  return Array.from(map.entries())
    .map(([k, v]) => ({ date: k, value: v.sum / (v.count || 1) }))
    .sort((a,b)=>a.date.localeCompare(b.date))
}

function toSeriesFromMap(map: Record<string, number>): SeriesPoint[] {
  return Object.entries(map).map(([d, v]) => ({ date: d, value: Number(v) || 0 }))
}

function collectExerciseNames(): string[] {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEYS.exercisesPrefix))
  const names = new Set<string>()
  for (const k of keys) {
    const list = loadJSON<ExerciseItem[]>(k, [])
    for (const ex of list) if (ex.name?.trim()) names.add(ex.name)
  }
  return Array.from(names).sort((a,b)=>a.localeCompare(b))
}

function collectExerciseSeries(name: string, metric: 'weight'|'reps'|'minutes'): SeriesPoint[] {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEYS.exercisesPrefix))
  const out: SeriesPoint[] = []
  for (const k of keys) {
    const date = k.replace(STORAGE_KEYS.exercisesPrefix, '')
    const list = loadJSON<ExerciseItem[]>(k, [])
    const same = list.filter(e => e.name === name)
    if (same.length) {
      const vals = same.map(e => {
        if (metric === 'weight') return e.weight ?? NaN
        if (metric === 'reps')   return e.reps ?? NaN
        return e.minutes ?? NaN
      }).filter(n => Number.isFinite(n)) as number[]
      if (vals.length) {
        const avg = vals.reduce((s,n)=>s+n,0)/vals.length
        out.push({ date, value: avg })
      }
    }
  }
  return out.sort((a,b)=>a.date.localeCompare(b.date))
}

// Tooltip formatters
const fmtKg = (v:number)=> `${Number(v).toLocaleString()} kg`
const fmtH  = (v:number)=> `${Number(v).toFixed(2)} h`
const fmtN  = (v:number)=> `${Number(v).toLocaleString()}`
const fmtMin= (v:number)=> `${Number(v).toLocaleString()} min`

export function Progress() {
  // Granularity filter (top-level)
  const [granularity, setGranularity] = useState<Granularity>('daily')

  // Body weight + sleep datasets
  const weightMap = loadJSON<Record<string, number>>('fitdash_bodyweight_map', {})
  const weightSeries = useMemo(
    () => aggregate(toSeriesFromMap(weightMap), granularity),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(weightMap), granularity]
  )

  const sleepMap = loadJSON<Record<string, number>>(STORAGE_KEYS.sleepMap, {})
  const sleepSeries = useMemo(
    () => aggregate(toSeriesFromMap(sleepMap), granularity),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sleepMap), granularity]
  )

  // Exercise card – controls live in the card header (near the chart)
  const exerciseNames = useMemo(collectExerciseNames, [localStorage.length])
  const [exerciseName, setExerciseName] = useState<string>('')
  const [metric, setMetric] = useState<'weight'|'reps'|'minutes'>('weight')

  const exerciseSeries = useMemo(() => {
    if (!exerciseName) return []
    return aggregate(collectExerciseSeries(exerciseName, metric), granularity)
  }, [exerciseName, metric, granularity])

  const gLabel =
    granularity === 'daily'   ? 'Daily'
  : granularity === 'monthly' ? 'Monthly (avg)'
  : 'Yearly (avg)'

  return (
    <div className="space-y-6">
      {/* Top filter bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-2xl ring-1 ring-border overflow-hidden bg-card">
          <button
            onClick={()=>setGranularity('daily')}
            className={`px-3 py-1.5 text-sm ${granularity==='daily'?'bg-surface text-fg':'text-muted hover:text-fg'}`}
          >
            Daily
          </button>
          <button
            onClick={()=>setGranularity('monthly')}
            className={`px-3 py-1.5 text-sm ${granularity==='monthly'?'bg-surface text-fg':'text-muted hover:text-fg'}`}
          >
            Monthly
          </button>
          <button
            onClick={()=>setGranularity('yearly')}
            className={`px-3 py-1.5 text-sm ${granularity==='yearly'?'bg-surface text-fg':'text-muted hover:text-fg'}`}
          >
            Yearly
          </button>
        </div>
        <div className="text-xs text-muted">Viewing: <span className="font-medium">{gLabel}</span></div>
      </div>

      {/* Body Weight (modern area) */}
      <Card>
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border bg-card">
          <div>
            <div className="font-semibold">Body Weight</div>
            <div className="text-xs text-muted">{gLabel}</div>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="h-64 rounded-2xl bg-surface ring-1 ring-border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="gradWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)' }} />
                <YAxis tick={{ fill: 'var(--muted)' }} domain={['auto','auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-900)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--fg)' }}
                  formatter={(v:any)=>[fmtKg(v as number), 'Weight']}
                  labelStyle={{ color: 'var(--muted)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#60a5fa" fill="url(#gradWeight)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Sleep (modern bar) */}
      <Card>
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border bg-card">
          <div>
            <div className="font-semibold">Sleep (hours)</div>
            <div className="text-xs text-muted">{gLabel}</div>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="h-64 rounded-2xl bg-surface ring-1 ring-border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)' }} />
                <YAxis tick={{ fill: 'var(--muted)' }} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-900)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--fg)' }}
                  formatter={(v:any)=>[fmtH(v as number), 'Sleep']}
                  labelStyle={{ color: 'var(--muted)' }}
                />
                <Bar dataKey="value" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Exercise progress (controls colocated with chart) */}
      <Card>
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border bg-card">
          <div>
            <div className="font-semibold">Exercise Progress</div>
            <div className="text-xs text-muted">
              {gLabel}{exerciseName ? ` • ${exerciseName}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input w-44"
              value={exerciseName}
              onChange={(e)=>setExerciseName(e.target.value)}
            >
              <option value="">Select exercise…</option>
              {exerciseNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select
              className="input w-36"
              value={metric}
              onChange={(e)=>setMetric(e.target.value as any)}
            >
              <option value="weight">Weight (kg)</option>
              <option value="reps">Reps</option>
              <option value="minutes">Minutes</option>
            </select>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="h-64 rounded-2xl bg-surface ring-1 ring-border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exerciseSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)' }} />
                <YAxis tick={{ fill: 'var(--muted)' }} domain={['auto','auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-900)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--fg)' }}
                  formatter={(v:any) => {
                    if (metric === 'weight') return [fmtKg(v as number), 'Weight']
                    if (metric === 'reps') return [fmtN(v as number), 'Reps']
                    return [fmtMin(v as number), 'Minutes']
                  }}
                  labelStyle={{ color: 'var(--muted)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Progress
