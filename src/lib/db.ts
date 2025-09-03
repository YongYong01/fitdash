import { FoodItem, uid } from './utils'

export async function searchFoodsDB(query: string): Promise<FoodItem[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`
  const res = await fetch(url)
  const data = await res.json()
  const products: any[] = data.products || []
  return products.map(p => {
    const kcalPer100 = p.nutriments?.['energy-kcal_100g'] ?? p.nutriments?.energy_kcal
    const name = p.product_name || p.generic_name || p.brands || p.code
    if (!name || !kcalPer100) return null
    return { id: uid(), name: String(name), calories: Math.round(Number(kcalPer100)), serving: '100 g' } as FoodItem
  }).filter(Boolean) as FoodItem[]
}

export async function fetchByBarcode(barcode: string): Promise<FoodItem | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`
  const res = await fetch(url)
  const data = await res.json()
  if (!data || data.status !== 1) return null
  const p = data.product
  const kcalPer100 = p.nutriments?.['energy-kcal_100g'] ?? p.nutriments?.energy_kcal
  const name = p.product_name || p.generic_name || p.brands || p.code
  if (!name || !kcalPer100) return null
  return { id: uid(), name: String(name), calories: Math.round(Number(kcalPer100)), serving: '100 g' }
}
