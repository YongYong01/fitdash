import React, { useEffect, useMemo, useState } from 'react'
import { Flame, Target, Apple, Search, Barcode, Star, StarOff, FolderPlus, Info } from 'lucide-react'
import { Card, CardHeader, Stat, EmptyState } from './UI'
import { DEFAULT_FOODS, STORAGE_KEYS, FoodItem, FoodLogItem, FavouriteMeal, uid, keyForDay } from '../lib/utils'
import { searchFoodsDB } from '../lib/db'
import { BarcodeModal } from './BarcodeModal'
import { CalorieCalcModal } from './CalorieCalcModal'

const XP = { FOOD_LOG: 5 }

function FoodRow({
  item,
  onAdd,
  onEditQty,
}: {
  item: FoodLogItem | FoodItem
  onAdd?: (qty: number) => void
  onEditQty?: (qty: number) => void
}) {
  const [qty, setQty] = useState<number | ''>('qty' in item ? item.qty : 1)
  const isLog = 'qty' in item

  return (
    <div className="col-span-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
      <input
        className="input w-20 text-center"
        type="number"
        min={0}
        value={qty}
        onChange={(e) => setQty(Number(e.target.value) || '')}
      />
      {isLog ? (
        <button
          onClick={() =>
            typeof qty === 'number' && qty >= 0 && onEditQty && onEditQty(qty)
          }
          className="btn-primary whitespace-nowrap w-full sm:w-auto"
        >
          Update
        </button>
      ) : (
        <button
          onClick={() =>
            typeof qty === 'number' && qty > 0 && onAdd && onAdd(qty)
          }
          className="btn-primary whitespace-nowrap w-full sm:w-auto"
        >
          Add
        </button>
      )}
    </div>
  )
}

export function Food({ date, onXP, onStreak }: { date: string; onXP: (n:number)=>void; onStreak: ()=>void }){
  // Library + favourites (global)
  const [foodLibrary, setFoodLibrary] = useState<FoodItem[]>(()=>{ const raw = localStorage.getItem(STORAGE_KEYS.foods); return raw? JSON.parse(raw): DEFAULT_FOODS })
  useEffect(()=> localStorage.setItem(STORAGE_KEYS.foods, JSON.stringify(foodLibrary)),[foodLibrary])
  const [favFoodIds, setFavFoodIds] = useState<string[]>(()=>{ try{ return JSON.parse(localStorage.getItem(STORAGE_KEYS.favFoods)||'[]') }catch{ return [] } })
  useEffect(()=> localStorage.setItem(STORAGE_KEYS.favFoods, JSON.stringify(favFoodIds)), [favFoodIds])
  const [favMeals, setFavMeals] = useState<FavouriteMeal[]>(()=>{ try{ return JSON.parse(localStorage.getItem(STORAGE_KEYS.favMeals)||'[]') }catch{ return [] } })
  useEffect(()=> localStorage.setItem(STORAGE_KEYS.favMeals, JSON.stringify(favMeals)), [favMeals])

  // Per-day log + calorie target
  const [foodLog, setFoodLog] = useState<FoodLogItem[]>(()=>{ const raw=localStorage.getItem(keyForDay(STORAGE_KEYS.foodLogPrefix, date)); return raw? JSON.parse(raw): [] })
  useEffect(()=>{ const raw=localStorage.getItem(keyForDay(STORAGE_KEYS.foodLogPrefix, date)); setFoodLog(raw? JSON.parse(raw): []) },[date])
  useEffect(()=> localStorage.setItem(keyForDay(STORAGE_KEYS.foodLogPrefix, date), JSON.stringify(foodLog)), [foodLog, date])

  const [calorieTarget, setCalorieTarget] = useState<number>(()=>{ const raw=localStorage.getItem(keyForDay(STORAGE_KEYS.calorieTargetPrefix, date)); return raw? Number(raw): 2400 })
  useEffect(()=>{ const raw=localStorage.getItem(keyForDay(STORAGE_KEYS.calorieTargetPrefix, date)); setCalorieTarget(raw? Number(raw): 2400) },[date])
  useEffect(()=> localStorage.setItem(keyForDay(STORAGE_KEYS.calorieTargetPrefix, date), String(calorieTarget||0)), [calorieTarget, date])

  // Search: local + OpenFoodFacts
  const [useDatabase, setUseDatabase] = useState(true)
  const [dbLoading, setDbLoading] = useState(false)
  const [dbResults, setDbResults] = useState<FoodItem[]>([])
  const [foodQuery, setFoodQuery] = useState('')
  const filteredFoods = useMemo(()=>{ const q=foodQuery.trim().toLowerCase(); if(!q) return foodLibrary; return foodLibrary.filter(f=>f.name.toLowerCase().includes(q)) },[foodQuery, foodLibrary])

  useEffect(()=>{ let cancel=false; (async()=>{ if(!useDatabase) return setDbResults([]); const q=foodQuery.trim(); if(!q) return setDbResults([]); setDbLoading(true); try{ const found = await searchFoodsDB(q); if(!cancel) setDbResults(found) } catch{ if(!cancel) setDbResults([]) } finally { if(!cancel) setDbLoading(false) } })(); return ()=>{ cancel=true } },[foodQuery,useDatabase])

  const [newFood, setNewFood] = useState({ name:'', calories:'', serving:'' })
  const addFoodToLibrary = (item?: FoodItem)=>{ let toAdd: FoodItem | null = null; if(item){ toAdd = { ...item, id: uid() } } else { const name=newFood.name.trim(); const cals=Number(newFood.calories); if(!name || !Number.isFinite(cals) || cals<=0) return null; toAdd = { id: uid(), name, calories: cals, serving: newFood.serving || undefined } } setFoodLibrary(p=>[toAdd!, ...p]); setNewFood({name:'',calories:'',serving:''}); return toAdd! }

  const toggleFavFood = (id:string)=> setFavFoodIds(p=> p.includes(id) ? p.filter(x=>x!==id) : [...p, id])
  const saveTodayAsMeal = ()=>{ if(!foodLog.length) return; const name = prompt('Name this favourite meal:'); if(!name) return; const meal: FavouriteMeal = { id: uid(), name: name.trim(), items: foodLog.map(f=>({ name: f.name, calories: f.calories, serving: f.serving, qty: f.qty })) }; setFavMeals(p=>[meal,...p]) }
  const applyMealToLog = (m: FavouriteMeal)=>{ const entries: FoodLogItem[] = m.items.map(it=>({ id: uid(), name: it.name, calories: it.calories, serving: it.serving, qty: it.qty, loggedAt: new Date().toISOString() })); setFoodLog(prev=>[...entries, ...prev]); onXP(XP.FOOD_LOG); onStreak() }

  const addFoodToLog = (f: FoodItem, qty: number)=>{ if(qty<=0) return; const entry: FoodLogItem = { ...f, qty, loggedAt: new Date().toISOString() }; setFoodLog(p=>[entry, ...p]); onXP(XP.FOOD_LOG); onStreak() }
  const editFoodQty = (idx:number, qty:number)=> setFoodLog(p=> p.map((x,i)=> i===idx? {...x, qty}: x))
  const removeFoodLog = (idx:number)=> setFoodLog(p=> p.filter((_,i)=>i!==idx))

  const totalCalories = useMemo(()=> foodLog.reduce((sum,x)=> sum + x.calories * x.qty, 0), [foodLog])
  const remaining = Math.max(0, (calorieTarget||0) - totalCalories)

  const [barcodeOpen, setBarcodeOpen] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)

  return (
    <Card>
      <CardHeader
        icon={<Flame className="w-5 h-5" />}
        title="Calories"
        subtitle="Log your meals"
        right={
          <button onClick={()=>setCalcOpen(true)} className="btn-secondary inline-flex items-center gap-1">
            <Info className="w-4 h-4" /> Info
          </button>
        }
      />
      <div className="p-3 sm:p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat title="Target" value={`${calorieTarget.toLocaleString()} kcal`} icon={<Target className="w-5 h-5"/>}/>
          <Stat title="Consumed" value={`${totalCalories.toLocaleString()} kcal`} icon={<Apple className="w-5 h-5"/>}/>
          <Stat title="Remaining" value={`${remaining.toLocaleString()} kcal`} accent valueClassName={remaining<=0? 'text-rose-300':'text-fg'}/>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input type="number" min={0} className="input w-32 sm:w-36" value={calorieTarget} onChange={e=>setCalorieTarget(Number(e.target.value)||0)} placeholder="Calorie target"/>
          <span className="text-xs text-muted">per day</span>
          <label className="flex items-center gap-2 ml-auto text-xs"><input type="checkbox" checked={useDatabase} onChange={e=>setUseDatabase(e.target.checked)}/> Search DB</label>
          <button onClick={()=>setBarcodeOpen(true)} className="btn-secondary inline-flex items-center gap-2"><Barcode className="w-4 h-4"/> Scan</button>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border p-2 sm:p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted"/>
            <input value={foodQuery} onChange={e=>setFoodQuery(e.target.value)} placeholder="Search foods (e.g., rice)" className="input flex-1"/>
          </div>

          {/* local results */}
          <div className="max-h-52 overflow-auto pr-1 space-y-2">
            {filteredFoods.map(f=> (
              <div key={f.id} className="grid grid-cols-12 items-center gap-2 rounded-2xl bg-surface ring-1 ring-border p-2">
                <div className="col-span-7">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <span className="truncate">{f.name}</span>
                    <button title={favFoodIds.includes(f.id)? 'Unfavourite':'Favourite'} onClick={()=>toggleFavFood(f.id)} className="opacity-70 hover:opacity-100">
                      {favFoodIds.includes(f.id)? <Star className="w-4 h-4"/>: <StarOff className="w-4 h-4"/>}
                    </button>
                  </div>
                  <div className="text-xs text-muted">{f.calories} kcal{f.serving? ` • ${f.serving}`: ''}</div>
                </div>
                <FoodRow item={f} onAdd={(qty)=>addFoodToLog(f, qty)}/>
              </div>
            ))}
            {filteredFoods.length===0 && <EmptyState title="No matches in your library" subtitle="Try DB search or add a custom food below." icon={<Apple className="w-6 h-6"/>}/>}
          </div>

          {/* db results */}
          {useDatabase && (
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted px-1 pb-2">Database results {dbLoading? '(loading…)': ''}</div>
              <div className="max-h-52 overflow-auto pr-1 space-y-2">
                {!dbLoading && dbResults.map(f=> (
                  <div key={f.id} className="grid grid-cols-12 items-center gap-2 rounded-2xl bg-surface ring-1 ring-border p-2">
                    <div className="col-span-7">
                      <div className="font-medium text-sm truncate">{f.name}</div>
                      <div className="text-xs text-muted">{f.calories} kcal • {f.serving || 'per 100 g'}</div>
                    </div>
                    <button onClick={()=>addFoodToLog(f,1)} className="col-span-2 btn-primary">Log</button>
                    <button onClick={()=>addFoodToLibrary(f)} className="col-span-3 btn-secondary">Add</button>
                  </div>
                ))}
                {!dbLoading && dbResults.length===0 && foodQuery.trim() && (<EmptyState title="No results from DB" subtitle="Try a simpler query."/>)}
              </div>
            </div>
          )}

          {/* add custom food */}
          <div className="grid grid-cols-12 gap-2 pt-2 border-t border-border">
            <input className="col-span-6 input" placeholder="Food name" value={newFood.name} onChange={e=>setNewFood({...newFood, name: e.target.value})}/>
            <input className="col-span-3 input" type="number" min={0} placeholder="kcal" value={newFood.calories} onChange={e=>setNewFood({...newFood, calories: e.target.value})}/>
            <input className="col-span-3 input" placeholder="serving" value={newFood.serving} onChange={e=>setNewFood({...newFood, serving: e.target.value})}/>
            <button onClick={()=>addFoodToLibrary()} className="col-span-12 btn-secondary">Add to library</button>
          </div>

          <div>
            <div className="px-1 pb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Log for {date}</h3>
              <button className="btn-secondary inline-flex items-center gap-2" onClick={saveTodayAsMeal}><FolderPlus className="w-4 h-4"/> Save as favourite meal</button>
            </div>
            <ul className="space-y-2">
              {foodLog.length===0 && <EmptyState title="Nothing logged yet" subtitle="Add items from the list above." icon={<Apple className="w-6 h-6"/>}/>}
              {foodLog.map((it,i)=> (
                <li key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-surface ring-1 ring-border p-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.name} <span className="text-muted font-normal">× {it.qty}</span></div>
                    <div className="text-sm text-muted">{it.serving? `${it.serving} • `: ''}{it.calories} kcal / serving</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm whitespace-nowrap">{(it.calories * it.qty).toLocaleString()} kcal</div>
                    <FoodRow item={it} onEditQty={(qty)=>editFoodQty(i, qty)} />
                    <button onClick={()=>removeFoodLog(i)} className="btn-secondary">Delete</button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Favourite meals list (optional quick apply) */}
            {favMeals.length > 0 && (
              <div className="mt-3 rounded-2xl bg-card ring-1 ring-border p-2">
                <div className="text-xs text-muted mb-2">Favourite meals</div>
                <div className="flex flex-wrap gap-2">
                  {favMeals.map(m => (
                    <button
                      key={m.id}
                      className="btn-secondary"
                      onClick={() => applyMealToLog(m)}
                      title={`${m.items.length} items`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barcode scanner modal */}
      <BarcodeModal open={barcodeOpen} onClose={()=>setBarcodeOpen(false)} onAdd={(f)=>addFoodToLog(f,1)}/>

      {/* Calorie calculator modal */}
      <CalorieCalcModal
        open={calcOpen}
        onClose={() => setCalcOpen(false)}
        onApply={(kcal) => {
          setCalorieTarget(kcal)
          setCalcOpen(false)
        }}
      />
    </Card>
  )
}
