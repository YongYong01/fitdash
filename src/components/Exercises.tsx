import React, { useEffect, useState } from 'react'
import { Plus, Trash2, ClipboardList, Database, Target, Pencil, Check, X } from 'lucide-react'
import { Card, CardHeader, EmptyState, Stat } from './UI'
import { COMMON_EXERCISES, STORAGE_KEYS, uid, ExerciseItem, keyForDay, needsWeight } from '../lib/utils'

const XP = { ADD_EXERCISE: 20 }

type EditState = {
  id: string
  name: string
  sets: number | ''
  reps: number | ''
  minutes: number | ''
  weight: number | '' // leave empty for N/A
  note: string
}

export function Exercises({ date, onXP, onStreak }: { date: string; onXP: (n:number)=>void; onStreak: ()=>void }) {
  const [exerciseName, setExerciseName] = useState('')
  const [exerciseSets, setExerciseSets] = useState<number|''>('')
  const [exerciseReps, setExerciseReps] = useState<number|''>('')
  const [exerciseMinutes, setExerciseMinutes] = useState<number|''>('')
  const [exerciseWeight, setExerciseWeight] = useState<number|''>('')
  const [exerciseNote, setExerciseNote] = useState<string>('')

  const [exercises, setExercises] = useState<ExerciseItem[]>(() => {
    const raw = localStorage.getItem(keyForDay(STORAGE_KEYS.exercisesPrefix, date))
    return raw ? JSON.parse(raw) : []
  })

  useEffect(() => {
    const raw = localStorage.getItem(keyForDay(STORAGE_KEYS.exercisesPrefix, date))
    setExercises(raw ? JSON.parse(raw) : [])
  }, [date])

  useEffect(() => {
    localStorage.setItem(keyForDay(STORAGE_KEYS.exercisesPrefix, date), JSON.stringify(exercises))
  }, [exercises, date])

  // per-day exercise target (count of entries)
  const [exTarget, setExTarget] = useState<number>(() =>
    Number(localStorage.getItem(keyForDay(STORAGE_KEYS.exerciseTargetPrefix, date)) || 0)
  )
  useEffect(() => {
    const v = localStorage.getItem(keyForDay(STORAGE_KEYS.exerciseTargetPrefix, date))
    setExTarget(v ? Number(v) : 0)
  }, [date])
  useEffect(() => {
    localStorage.setItem(keyForDay(STORAGE_KEYS.exerciseTargetPrefix, date), String(exTarget || 0))
  }, [exTarget, date])

  // --- Inline edit state
  const [editing, setEditing] = useState<EditState | null>(null)

  const beginEdit = (ex: ExerciseItem) => {
    setEditing({
      id: ex.id,
      name: ex.name ?? '',
      sets: typeof ex.sets === 'number' ? ex.sets : '',
      reps: typeof ex.reps === 'number' ? ex.reps : '',
      minutes: typeof ex.minutes === 'number' ? ex.minutes : '',
      weight: typeof ex.weight === 'number' ? ex.weight : '',
      note: ex.note ?? '',
    })
  }

  const cancelEdit = () => setEditing(null)

  const saveEdit = () => {
    if (!editing) return
    const willUseWeight = needsWeight(editing.name)
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== editing.id) return ex
        return {
          ...ex,
          name: editing.name.trim() || ex.name,
          sets: typeof editing.sets === 'number' ? editing.sets : undefined,
          reps: typeof editing.reps === 'number' ? editing.reps : undefined,
          minutes: typeof editing.minutes === 'number' ? editing.minutes : undefined,
          weight: willUseWeight
            ? (typeof editing.weight === 'number' ? editing.weight : undefined)
            : undefined,
          note: editing.note.trim() ? editing.note.trim() : undefined,
        }
      })
    )
    setEditing(null)
  }

  // --- Add/Remove
  const add = (preset?: {name:string; template?: Partial<ExerciseItem>}) => {
    const name = preset?.name ?? exerciseName.trim(); if(!name) return

    const willUseWeight = needsWeight(name);
    const weightValue =
      typeof exerciseWeight === 'number' ? exerciseWeight :
      (willUseWeight && typeof preset?.template?.weight === 'number' ? preset!.template!.weight : undefined);

    const item: ExerciseItem = {
      id: uid(),
      name,
      sets: typeof exerciseSets==='number'?exerciseSets: preset?.template?.sets,
      reps: typeof exerciseReps==='number'?exerciseReps: preset?.template?.reps,
      minutes: typeof exerciseMinutes==='number'?exerciseMinutes: preset?.template?.minutes,
      weight: willUseWeight ? weightValue : undefined,
      note: (exerciseNote?.trim() || preset?.template?.note) ?? undefined,
    };

    setExercises(p=>[item,...p]);
    setExerciseName(''); setExerciseSets(''); setExerciseReps(''); setExerciseMinutes(''); setExerciseWeight(''); setExerciseNote('');
    onXP(XP.ADD_EXERCISE); onStreak()
  }

  const remove = (id:string)=> setExercises(p=>p.filter(x=>x.id!==id))

  const done = exercises.length
  const remaining = Math.max(0, (exTarget||0) - done)

  return (
    <Card>
      <CardHeader icon={<ClipboardList className="w-5 h-5"/>} title="Daily Exercises" subtitle={`Editing: ${date}`}/>
      <div className="p-3 sm:p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat title="Target (count)" value={`${exTarget||0}`} icon={<Target className="w-5 h-5"/>}/>
          <Stat title="Logged" value={`${done}`} />
          <Stat title="Remaining" value={`${remaining}`} accent valueClassName={remaining===0? 'text-accent':'text-fg'} />
        </div>

        {/* Add row */}
        <div className="grid grid-cols-12 gap-2">
          <input value={exerciseName} onChange={e=>setExerciseName(e.target.value)} placeholder="Exercise (e.g., Squats)" className="col-span-12 sm:col-span-6 input"/>
          <input value={exerciseSets} onChange={e=>setExerciseSets(Number(e.target.value)||'')} placeholder="Sets" type="number" min={0} className="col-span-4 sm:col-span-2 input"/>
          <input value={exerciseReps} onChange={e=>setExerciseReps(Number(e.target.value)||'')} placeholder="Reps" type="number" min={0} className="col-span-4 sm:col-span-2 input"/>
          <input value={exerciseMinutes} onChange={e=>setExerciseMinutes(Number(e.target.value)||'')} placeholder="Minutes" type="number" min={0} className="col-span-4 sm:col-span-2 input"/>
          {needsWeight(exerciseName) && (
            <input
              value={exerciseWeight}
              onChange={e=>setExerciseWeight(Number(e.target.value)||'')}
              placeholder="Weight (kg)"
              type="number"
              min={0}
              className="col-span-6 sm:col-span-2 input"
            />
          )}
          <input
            value={exerciseNote}
            onChange={e=>setExerciseNote(e.target.value)}
            placeholder="Note (optional) — e.g., Free weights, Level 10, RPE 8"
            className="col-span-12 input"
          />
          <button onClick={()=>add()} className="col-span-12 btn-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> Add</button>
        </div>

        {/* Common exercises */}
        <div className="rounded-2xl bg-card ring-1 ring-border p-2 sm:p-3 space-y-2">
          <div className="text-xs text-muted flex items-center gap-2"><Database className="w-4 h-4"/> Common exercises</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-auto pr-1">
            {COMMON_EXERCISES.map(c=> (
              <button key={c.name} onClick={()=>add({name:c.name, template:c.template})} className="btn-secondary text-left">
                <div className="text-sm font-medium truncate">{c.name}</div>
                {c.template && <div className="text-xs text-muted">
                  {c.template.sets? `${c.template.sets}×${c.template.reps??'?'} `: ''}
                  {c.template.minutes? `${c.template.minutes} min`: ''}
                  {c.template.weight? `, ${c.template.weight} kg`: ''}
                  {c.template.note? ` (${c.template.note})`: ''}
                </div>}
              </button>
            ))}
          </div>
        </div>

        {/* List with inline edit */}
        <ul className="space-y-2">
          {exercises.length===0 && <EmptyState icon={<Database className="w-6 h-6"/>} title="No exercises yet for this day" subtitle="Add some above or quick-add from list."/>}
          {exercises.map(ex=> {
            const isEditing = editing?.id === ex.id
            const showWeight = needsWeight(isEditing ? editing.name : ex.name)

            if (isEditing) {
              return (
                <li key={ex.id} className="rounded-2xl bg-surface ring-1 ring-border p-3 space-y-2">
                  <div className="grid grid-cols-12 gap-2">
                    <input
                      className="col-span-12 sm:col-span-5 input"
                      value={editing.name}
                      onChange={e=>setEditing(s=>s? {...s, name:e.target.value}: s)}
                      placeholder="Exercise name"
                    />
                    <input
                      className="col-span-4 sm:col-span-2 input"
                      type="number" min={0}
                      value={editing.sets}
                      onChange={e=>setEditing(s=>s? {...s, sets: Number(e.target.value)||''}: s)}
                      placeholder="Sets"
                    />
                    <input
                      className="col-span-4 sm:col-span-2 input"
                      type="number" min={0}
                      value={editing.reps}
                      onChange={e=>setEditing(s=>s? {...s, reps: Number(e.target.value)||''}: s)}
                      placeholder="Reps"
                    />
                    <input
                      className="col-span-4 sm:col-span-2 input"
                      type="number" min={0}
                      value={editing.minutes}
                      onChange={e=>setEditing(s=>s? {...s, minutes: Number(e.target.value)||''}: s)}
                      placeholder="Minutes"
                    />
                    {showWeight && (
                      <input
                        className="col-span-6 sm:col-span-2 input"
                        type="number" min={0}
                        value={editing.weight}
                        onChange={e=>setEditing(s=>s? {...s, weight: Number(e.target.value)||''}: s)}
                        placeholder="Weight (kg)"
                      />
                    )}
                    <input
                      className="col-span-12 input"
                      value={editing.note}
                      onChange={e=>setEditing(s=>s? {...s, note:e.target.value}: s)}
                      placeholder="Note (optional)"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={cancelEdit} className="btn-secondary inline-flex items-center gap-1"><X className="w-4 h-4"/> Cancel</button>
                    <button onClick={saveEdit} className="btn-primary inline-flex items-center gap-1"><Check className="w-4 h-4"/> Save</button>
                  </div>
                </li>
              )
            }

            return (
              <li key={ex.id} className="group flex items-start justify-between gap-3 rounded-2xl bg-surface ring-1 ring-border p-3">
                <div>
                  <div className="font-medium">{ex.name}</div>
                  <div className="text-sm text-muted">
                    {ex.sets? `${ex.sets} sets`: null}{ex.sets && ex.reps? ', ': null}{ex.reps? `${ex.reps} reps`: null}{(ex.sets||ex.reps)&&ex.minutes? ', ': null}{ex.minutes? `${ex.minutes} min`: null}
                    {needsWeight(ex.name) ? `, ${ex.weight != null ? ex.weight + ' kg' : 'N/A'}` : ''}
                  </div>
                  {ex.note && <div className="text-xs text-muted mt-0.5">📝 {ex.note}</div>}
                </div>
                <div className="flex items-center gap-2 opacity-80">
                  <button onClick={()=>beginEdit(ex)} className="hover:text-emerald-300 transition"><Pencil className="w-4 h-4"/></button>
                  <button onClick={()=>remove(ex.id)} className="hover:text-rose-300 transition"><Trash2 className="w-4 h-4"/></button>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted">Exercise target:</label>
          <input type="number" min={0} value={exTarget} onChange={e=>setExTarget(Number(e.target.value)||0)} className="input w-28"/>
        </div>
      </div>
    </Card>
  )
}
