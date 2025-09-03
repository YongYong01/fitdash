import React from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { addDays } from '../lib/utils'

export function DateBar({ date, onChange }: { date: string; onChange: (d:string)=>void }){
  return (
    <div className="flex items-center gap-2">
      <button className="btn-secondary px-2" onClick={()=>onChange(addDays(date,-1))}><ChevronLeft className="w-4 h-4"/></button>
      <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-border bg-card">
        <CalendarDays className="w-4 h-4"/><span className="font-medium">{date}</span>
      </div>
      <button className="btn-secondary px-2" onClick={()=>onChange(addDays(date,+1))}><ChevronRight className="w-4 h-4"/></button>
      <input
        type="date"
        value={date}
        onChange={e=> onChange(e.target.value)}
        className="input !w-auto !px-2 !py-1"
      />
    </div>
  )
}
