import React, { useMemo, useState } from 'react'
import { X } from 'lucide-react'

type Sex = 'male' | 'female'
type Activity = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra'
type Goal = 'lose' | 'maintain' | 'gain'

const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
}

// Rough energy equivalent for 1 kg body weight change
const KCAL_PER_KG = 7700
const MIN_SAFE_TARGET = 1200 // simple guard for very low targets

export function CalorieCalcModal({
  open, onClose, onApply,
}: {
  open: boolean
  onClose: () => void
  onApply: (target: number) => void
}) {
  const [sex, setSex] = useState<Sex>('male')
  const [age, setAge] = useState<number | ''>('')           // years
  const [height, setHeight] = useState<number | ''>('')     // cm
  const [weight, setWeight] = useState<number | ''>('')     // kg
  const [activity, setActivity] = useState<Activity>('moderate')

  // NEW: goal + weekly change
  const [goal, setGoal] = useState<Goal>('maintain')
  const [changePerWeekKg, setChangePerWeekKg] = useState<number | ''>('') // positive number; meaning depends on goal

  const bmr = useMemo(() => {
    if (typeof age !== 'number' || typeof height !== 'number' || typeof weight !== 'number') return null
    // Mifflin–St Jeor
    const base = 10 * weight + 6.25 * height - 5 * age
    return Math.round(base + (sex === 'male' ? 5 : -161))
  }, [sex, age, height, weight])

  const tdee = useMemo(() => (bmr ? Math.round(bmr * ACTIVITY_FACTORS[activity]) : null), [bmr, activity])

  // Daily energy delta required for requested weekly change
  // Positive for surplus (gain), positive "deficit" for lose (we'll label accordingly)
  const dailyDeltaAbs = useMemo(() => {
    if (typeof changePerWeekKg !== 'number' || changePerWeekKg <= 0) return 0
    return Math.round((changePerWeekKg * KCAL_PER_KG) / 7)
  }, [changePerWeekKg])

  // Custom target derived from goal + weekly change
  const customTarget = useMemo(() => {
    if (!tdee) return null
    if (goal === 'maintain' || dailyDeltaAbs === 0) return tdee
    if (goal === 'lose') return Math.max(MIN_SAFE_TARGET, tdee - dailyDeltaAbs)
    // gain
    return tdee + dailyDeltaAbs
  }, [tdee, goal, dailyDeltaAbs])

  const goalLabel =
    goal === 'lose'
      ? `Lose ${typeof changePerWeekKg === 'number' && changePerWeekKg > 0 ? `~${changePerWeekKg.toFixed(1)} kg/week` : ''}`
      : goal === 'gain'
      ? `Gain ${typeof changePerWeekKg === 'number' && changePerWeekKg > 0 ? `~${changePerWeekKg.toFixed(1)} kg/week` : ''}`
      : 'Maintain weight'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 ring-1 ring-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="font-medium">Calorie Calculator</div>
          <button onClick={onClose} className="btn-secondary inline-flex items-center gap-1">
            <X className="w-4 h-4" /> Close
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Inputs */}
          <div className="grid grid-cols-12 gap-2">
            <select className="col-span-6 input" value={sex} onChange={e=>setSex(e.target.value as Sex)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <select className="col-span-6 input" value={activity} onChange={e=>setActivity(e.target.value as Activity)}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light (1–3x/wk)</option>
              <option value="moderate">Moderate (3–5x)</option>
              <option value="very">Very (6–7x)</option>
              <option value="extra">Extra (athlete)</option>
            </select>

            <input
              className="col-span-4 input"
              placeholder="Age"
              type="number" min={0}
              value={age}
              onChange={e=>setAge(Number(e.target.value) || '')}
            />
            <input
              className="col-span-4 input"
              placeholder="Height (cm)"
              type="number" min={0}
              value={height}
              onChange={e=>setHeight(Number(e.target.value) || '')}
            />
            <input
              className="col-span-4 input"
              placeholder="Weight (kg)"
              type="number" min={0}
              value={weight}
              onChange={e=>setWeight(Number(e.target.value) || '')}
            />
          </div>

          {/* Goal row */}
          <div className="grid grid-cols-12 gap-2 items-start">
            <select
              className="col-span-6 input"
              value={goal}
              onChange={e => {
                const next = e.target.value as Goal
                setGoal(next)
                // keep existing number; only matters if not maintain
              }}
            >
              <option value="lose">Lose</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Lean gain</option>
            </select>

            {/* per-week change, disabled for maintain */}
            <input
              className="col-span-6 input"
              placeholder={goal === 'gain' ? 'Gain per week (kg)' : 'Lose per week (kg)'}
              type="number"
              min={0}
              step={0.1}
              disabled={goal === 'maintain'}
              value={goal === 'maintain' ? '' : changePerWeekKg}
              onChange={e=>setChangePerWeekKg(Number(e.target.value) || '')}
            />
          </div>

          {/* Summary / deltas */}
          <div className="rounded-2xl bg-slate-800/40 ring-1 ring-slate-700/60 p-3 space-y-1 text-sm">
            <div>BMR: <span className="font-medium">{bmr ?? '—'}</span> kcal</div>
            <div>TDEE ({activity}): <span className="font-medium">{tdee ?? '—'}</span> kcal</div>

            <div className="mt-1 text-slate-300">Goal: <span className="font-medium">
              {goalLabel || (goal === 'maintain' ? 'Maintain weight' : '')}
            </span></div>

            {goal !== 'maintain' && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{goal === 'lose' ? 'Daily deficit' : 'Daily surplus'}</span>
                <span className="font-medium">{dailyDeltaAbs ? `${dailyDeltaAbs} kcal` : '—'}</span>
              </div>
            )}

            {tdee && (
              <>
                <div className="mt-2 text-slate-300">Suggestions:</div>
                <div>Lose ~0.5 kg/wk: <span className="font-medium">{Math.max(MIN_SAFE_TARGET, tdee - Math.round((0.5 * KCAL_PER_KG)/7))}</span> kcal</div>
                <div>Maintain: <span className="font-medium">{tdee}</span> kcal</div>
                <div>Lean gain: <span className="font-medium">{tdee + 300}</span> kcal</div>
                <div className="mt-1">Custom target: <span className="font-medium">{customTarget ?? '—'}</span> kcal</div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button className="btn-secondary" onClick={onClose}>Close</button>
            <button
              className="btn-primary"
              disabled={!tdee}
              onClick={() => {
                if (!tdee) return
                onApply(customTarget ?? tdee)
              }}
            >
              Apply as daily target
            </button>
          </div>

          <div className="text-[11px] text-slate-400 pt-1">
            Estimates use Mifflin–St Jeor (BMR) and activity multipliers. 1 kg ≈ 7,700 kcal.
            Targets are guides, not medical advice.
          </div>
        </div>
      </div>
    </div>
  )
}
