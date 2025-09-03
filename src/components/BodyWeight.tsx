import React, { useEffect, useState } from 'react'

export function BodyWeight({ date }: { date: string }) {
  const [weight, setWeight] = useState<number | ''>('')

  useEffect(() => {
    const raw = localStorage.getItem('fitdash_bodyweight_map')
    if (raw) {
      const map = JSON.parse(raw)
      setWeight(map[date] ?? '')
    } else {
      setWeight('')
    }
  }, [date])

  const save = (val: number | '') => {
    setWeight(val)
    const raw = localStorage.getItem('fitdash_bodyweight_map')
    const map = raw ? JSON.parse(raw) : {}
    if (val === '') {
      delete map[date]
    } else {
      map[date] = val
    }
    localStorage.setItem('fitdash_bodyweight_map', JSON.stringify(map))
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={weight}
        onChange={(e) => save(Number(e.target.value) || '')}
        placeholder="Weight"
        className="input w-20"
      />
      <span className="text-xs text-muted">kg</span>
    </div>
  )
}
