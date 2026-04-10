export interface TDEEInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: string;
  activityLevel: string;
  dietIntensity: string;
  primaryGoal: string;
}

export interface NutritionTargets {
  tdee: number;
  targetCalories: number;
  proteinTarget: number;
  fatTarget: number;
  carbTarget: number;
  fibreTarget: number;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  'sedentary': 1.2,
  'lightly_active': 1.375,
  'moderately_active': 1.55,
  'very_active': 1.725
};

const INTENSITY_DEFICIT: Record<string, number> = {
  'low': 300,
  'moderate': 500,
  'high': 750
};

export function calculateTDEE(input: TDEEInput): NutritionTargets {
  const { weightKg, heightCm, age, gender, activityLevel, dietIntensity, primaryGoal } = input;

  // Mifflin-St Jeor
  let bmr: number;
  if (gender.toLowerCase() === 'female') {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  } else {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;
  const tdee = Math.round(bmr * multiplier);

  let deficit = INTENSITY_DEFICIT[dietIntensity] || 500;

  // Adjust for goal
  if (primaryGoal === 'gain_muscle') {
    deficit = -deficit; // surplus
  } else if (primaryGoal === 'maintain') {
    deficit = 0;
  }

  const targetCalories = Math.max(1000, Math.round(tdee - deficit));

  // Protein: 1.8-2.2g/kg (higher for high intensity)
  const proteinPerKg = dietIntensity === 'high' ? 2.2 : dietIntensity === 'moderate' ? 2.0 : 1.8;
  const proteinTarget = Math.round(weightKg * proteinPerKg);

  // Fat: 25-30% of calories
  const fatCalories = targetCalories * 0.27;
  const fatTarget = Math.round(fatCalories / 9);

  // Carbs: remainder, minimum 50g
  const proteinCalories = proteinTarget * 4;
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbTarget = Math.max(50, Math.round(remainingCalories / 4));

  // Fibre: 25-35g
  const fibreTarget = 30;

  return {
    tdee,
    targetCalories,
    proteinTarget,
    fatTarget,
    carbTarget,
    fibreTarget
  };
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}
