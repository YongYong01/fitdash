import React from 'react'
import { Trophy } from 'lucide-react'

function levelFromXP(xp: number){ let l=1, rem=xp, need=req(l); while(rem>=need){ rem-=need; l++; need=req(l);} return {level:l,current:rem,needed:need} }
function req(l:number){ return Math.round(100*Math.pow(l,1.2)) }

export function XPBadge({ xp, streak }: { xp: number; streak: number }){
  const { level, current, needed } = levelFromXP(xp)
  const pct = Math.min(100, Math.round((current/needed)*100))
  return (
    <div className="rounded-2xl ring-1 ring-border bg-accent/10 px-3 py-2 flex items-center gap-3">
      <div className="flex items-center gap-2"><Trophy className="w-4 h-4"/><div className="text-sm font-semibold">Lvl {level}</div></div>
      <div className="w-28 h-2 rounded-full bg-surface overflow-hidden"><div className="h-full" style={{ background: 'var(--accent)', width: pct+'%' }} /></div>
      <div className="text-xs">{current}/{needed} XP</div>
      {streak>0 && <div className="text-xs">🔥 {streak}d</div>}
    </div>
  )
}
