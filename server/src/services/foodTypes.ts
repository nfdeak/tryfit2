export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export interface ServingSize {
  label: string;
  grams: number;
}

export interface FoodResult {
  id: string;
  name: string;
  description: string;
  source: 'open_food_facts' | 'usda' | 'ai_estimate';
  servingSizes: ServingSize[];
  defaultServing: ServingSize;
  per100g: Macros;
  perServing: Macros;
  isAiEstimate: boolean;
}

export interface AIComponent {
  name: string;
  portionDescription: string;
  estimatedGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number;
}

export interface AIEstimateResult {
  components: AIComponent[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fibreG: number;
  };
  confidenceNote: string;
}
