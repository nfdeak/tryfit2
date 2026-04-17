import { FoodResult } from './foodTypes';

const BASE = 'https://api.nal.usda.gov/fdc/v1';

function mapUSDAFood(f: any): FoodResult {
  const getNutrient = (id: number) =>
    f.foodNutrients?.find((n: any) => n.nutrientId === id)?.value ?? 0;

  const cal = getNutrient(1008);
  const prot = getNutrient(1003);
  const carb = getNutrient(1005);
  const fat = getNutrient(1004);
  const fib = getNutrient(1079);

  const servingGrams = f.servingSize ?? 100;
  const servingUnit = f.servingSizeUnit ?? 'g';

  return {
    id: `usda-${f.fdcId}`,
    name: f.description || f.lowercaseDescription || 'Unknown',
    description: f.brandName ?? f.brandOwner ?? '',
    source: 'usda',
    servingSizes: [
      { label: `${servingGrams}${servingUnit}`, grams: servingGrams },
      { label: '100g', grams: 100 },
    ],
    defaultServing: { label: `${servingGrams}${servingUnit}`, grams: servingGrams },
    per100g: {
      calories: Math.round(cal),
      protein: Math.round(prot * 10) / 10,
      carbs: Math.round(carb * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fibre: Math.round(fib * 10) / 10,
    },
    perServing: {
      calories: Math.round((cal * servingGrams) / 100),
      protein: Math.round((prot * servingGrams) / 10) / 10,
      carbs: Math.round((carb * servingGrams) / 10) / 10,
      fat: Math.round((fat * servingGrams) / 10) / 10,
      fibre: Math.round((fib * servingGrams) / 10) / 10,
    },
    isAiEstimate: false,
  };
}

export async function searchUSDA(query: string): Promise<FoodResult[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    console.warn('USDA_API_KEY not set, skipping USDA search');
    return [];
  }

  const res = await fetch(
    `${BASE}/foods/search?` +
      new URLSearchParams({
        query,
        pageSize: '6',
        api_key: apiKey,
      }),
    { signal: AbortSignal.timeout(8000) }
  );

  if (!res.ok) throw new Error(`USDA responded with ${res.status}`);

  const data: any = await res.json();
  return (data.foods || [])
    .filter((f: any) => f.description)
    .map(mapUSDAFood)
    .slice(0, 6);
}
