export const todayISO = () => new Date().toISOString().slice(0, 10)
export const uid = () => Math.random().toString(36).slice(2, 10)

export const addDays = (iso: string, delta: number) => {
  const d = new Date(iso); d.setDate(d.getDate() + delta); return d.toISOString().slice(0,10)
}

export const STORAGE_KEYS = {
  foods: 'fitdash_foods',                 // library (global)
  favFoods: 'fitdash_fav_food_ids',       // global
  favMeals: 'fitdash_fav_meals',          // global
  xp: 'fitdash_xp_total',                 // global
  lastActiveDay: 'fitdash_last_active_day',
  streak: 'fitdash_daily_streak',
  theme: 'fitdash_theme',
  accent: 'fitdash_accent',

  // per-day prefixes
  exercisesPrefix: 'fitdash_exercises_',       // + YYYY-MM-DD
  exerciseTargetPrefix: 'fitdash_ex_target_',  // + YYYY-MM-DD  (number of entries target)
  foodLogPrefix: 'fitdash_foodlog_',           // + YYYY-MM-DD
  calorieTargetPrefix: 'fitdash_calorie_target_', // + YYYY-MM-DD
  sleepMap: 'fitdash_sleep_map',               // object map: { [YYYY-MM-DD]: hours }
  sleepQualityMap: 'fitdash_sleep_quality_map', // object map: { [YYYY-MM-DD]: '😴' | '🙂' | '😐' | '😫' }
} as const

export const keyForDay = (prefix: string, dayISO: string) => `${prefix}${dayISO}`

// add "weight" and "note" to the existing interface
export interface ExerciseItem {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  minutes?: number;
  weight?: number;       // <-- already present if you added earlier; keep it
  note?: string;         // <-- NEW
}

export interface FoodItem { id: string; name: string; calories: number; serving?: string }
export interface FoodLogItem extends FoodItem { qty: number; loggedAt: string }
export interface FavouriteMeal { id: string; name: string; items: { name: string; calories: number; serving?: string; qty: number }[] }

export const DEFAULT_FOODS: FoodItem[] = [
  { id: uid(), name: 'Banana', calories: 105, serving: '1 medium' },
  { id: uid(), name: 'Apple', calories: 95, serving: '1 medium' },
  { id: uid(), name: 'Chicken Breast', calories: 165, serving: '100 g' },
  { id: uid(), name: 'White Rice', calories: 206, serving: '1 cup cooked' },
  { id: uid(), name: 'Eggs', calories: 78, serving: '1 large' },
  { id: uid(), name: 'Greek Yogurt', calories: 130, serving: '170 g' },
  { id: uid(), name: 'Oats', calories: 150, serving: '40 g (dry)' },
  { id: uid(), name: 'Almonds', calories: 170, serving: '28 g (handful)' },
  { id: uid(), name: 'Broccoli', calories: 55, serving: '1 cup' },
  { id: uid(), name: 'Olive Oil', calories: 119, serving: '1 tbsp' },
]

export const COMMON_EXERCISES: { name: string; template?: Partial<ExerciseItem> }[] = [
  // --- Your personal presets ---
  { name: 'Bench Press', template: { sets: 3, reps: 8, weight: 28, note: 'Free weights' } },
  { name: 'Biceps Curl', template: { sets: 3, reps: 10, weight: 20, note: 'Free weights' } },
  { name: 'Row',         template: { sets: 3, reps: 12, weight: 30, note: 'Machine or cable' } },
  { name: 'Stairmaster', template: { minutes: 20, note: 'Level 10' } },

  // --- Other common lifts with reasonable starter weights ---
  { name: 'Squat',        template: { sets: 3, reps: 8, weight: 40, note: 'Barbell back squat' } },
  { name: 'Deadlift',     template: { sets: 3, reps: 5, weight: 60, note: 'Conventional barbell' } },
  { name: 'Overhead Press', template: { sets: 3, reps: 8, weight: 20, note: 'Standing barbell press' } },
  { name: 'Pull-ups',     template: { sets: 3, reps: 6, note: 'Bodyweight — add weight if easy' } },
  { name: 'Rows',         template: { sets: 3, reps: 10, weight: 25, note: 'Dumbbell rows' } },
  { name: 'Lunges',       template: { sets: 3, reps: 10, weight: 20, note: 'Dumbbells in each hand' } },

  // --- Bodyweight / cardio (no default weight) ---
  { name: 'Plank',        template: { minutes: 3, note: 'Hold position' } },
  { name: 'Running',      template: { minutes: 30, note: 'Outdoor or treadmill' } },
  { name: 'Cycling',      template: { minutes: 30, note: 'Stationary bike or road' } },
  { name: 'Jump Rope',    template: { minutes: 10, note: 'Steady pace' } },
]



// --- Exercise classification (simple keyword-based)
export type ExerciseKind = 'strength' | 'cardio' | 'bodyweight'

export function classifyExercise(name: string): ExerciseKind {
  const n = name.toLowerCase()

  const cardio = ['run', 'jog', 'cycling', 'bike', 'row', 'rowing', 'elliptical', 'swim', 'skipping', 'jump rope', 'hike', 'walk']
  if (cardio.some(k => n.includes(k))) return 'cardio'

  const body = ['push-up', 'push up', 'pull-up', 'pull up', 'chin-up', 'dip', 'plank', 'burpee', 'sit-up', 'crunch', 'mountain climber']
  if (body.some(k => n.includes(k))) return 'bodyweight'

  return 'strength'
}

export function needsWeight(name: string) {
  return classifyExercise(name) === 'strength'
}

export function kindLabel(name: string) {
  const k = classifyExercise(name)
  if (k === 'cardio') return 'Cardio'
  if (k === 'bodyweight') return 'Bodyweight'
  return 'Strength'
}
