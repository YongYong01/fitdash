import React, { useEffect, useMemo, useState } from 'react'
import { BedDouble, Moon, Pencil } from 'lucide-react'
import { Card, CardHeader } from './UI'
import { STORAGE_KEYS, todayISO, addDays } from '../lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type SleepMap = Record<string, number>

function loadSleepMap(): SleepMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sleepMap)
    if (raw) return JSON.parse(raw)
  } catch {}
  // migrate from old array if it existed (best-effort)
  return {}
}
function saveSleepMap(map: SleepMap) {
  localStorage.setItem(STORAGE_KEYS.sleepMap, JSON.stringify(map))
}

export function Sleep({ date, onXP, onStreak }: { date: string; onXP: (n:number)=>void; onStreak: ()=>void }){
  const XP_SLEEP_GOAL = 30
  const [sleepGoal, setSleepGoal] = useState<number>(()=> 8)

  const [sleepMap, setSleepMap] = useState<SleepMap>(()=> loadSleepMap())
  useEffect(()=> saveSleepMap(sleepMap), [sleepMap])

  const hoursFor = (d:string)=> sleepMap[d] ?? 0
  const setHoursFor = (d:string, h:number)=>{
    setSleepMap(prev => ({ ...prev, [d]: h }))
    if (d === todayISO() && h >= sleepGoal) { onXP(XP_SLEEP_GOAL); onStreak() }
  }

  // show 7-day window centered on selected date’s week (or simply last 7 up to date)
  const windowDays = useMemo(()=>{
    const arr: { date:string; hours:number }[] = []
    // last 6 days + current selected date
    for(let i=6;i>=0;i--){
      const d = addDays(date, -i)
      arr.push({ date: d, hours: hoursFor(d) })
    }
    return arr
  },[date, sleepMap])

  const avg = (windowDays.reduce((s,d)=>s+d.hours,0)/(windowDays.length||1)).toFixed(2)

  const [editInput, setEditInput] = useState<string>('') // controlled input for quick set

  return (
    <Card>
      <CardHeader icon={<BedDouble className="w-5 h-5"/>} title="Sleep" subtitle={`Editing: ${date}`}/>
      <div className="p-3 sm:p-4 space-y-4">
        <div className="flex items-center flex-wrap gap-3">
          <Moon className="w-5 h-5"/>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Goal</span>
            <input type="number" min={0} step={0.5} value={sleepGoal} onChange={e=>setSleepGoal(Number(e.target.value)||0)} className="input w-24"/>
            <span className="text-sm text-muted">h / night</span>
          </div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border p-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={windowDays} margin={{ left:4, right:4, top:8, bottom:8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15}/>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(d)=> String(d).slice(5) }/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, Math.max(10, sleepGoal + 2)]}/>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: 12 }} labelFormatter={(d)=>`Date: ${d}`} formatter={(v:any)=>[`${v} h`, 'Sleep']}/>
              <Bar dataKey="hours" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number" step={0.25} min={0}
            placeholder={`Hours for ${date}`}
            className="input w-52"
            value={editInput}
            onChange={e=>setEditInput(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==='Enter'){ const val = Number(editInput); if(Number.isFinite(val)) setHoursFor(date, val); setEditInput('') } }}
          />
          <button className="btn-primary inline-flex items-center gap-2" onClick={()=>{ const val = Number(editInput); if(Number.isFinite(val)) setHoursFor(date, val); setEditInput('') }}>
            <Pencil className="w-4 h-4"/> Save
          </button>
        </div>

        <div className="text-sm text-muted">7-day avg: {avg} h • Goal: {sleepGoal} h</div>
      </div>
    </Card>
  )
}
