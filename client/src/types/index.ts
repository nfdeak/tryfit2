export interface User {
  id: string;
  username: string | null;
  email: string | null;
  name: string | null;
  avatar: string | null;
  onboardingDone: boolean;
}

export interface Meal {
  mealIndex?: number;
  type?: string;
  name: string;
  description: string;
  time: string;
  cookingTip?: string;
  ingredients?: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre?: number;
}

export interface DayPlan {
  label: string;
  dayIndex?: number;
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  totalFibre?: number;
  meals: Meal[];
}

export interface MealState {
  mealIndex: number;
  eaten: boolean;
}

export interface DayTrackerState {
  date: string;
  dayIndex: number;
  meals: MealState[];
}

export interface TrackerStats {
  eaten: number;
  total: number;
  adherence: number;
  streak: number;
  remaining: number;
  mealsPerDay?: number;
}

export interface ShoppingItemData {
  key: string;
  name: string;
  quantity?: string;
  unit?: string;
  bought: boolean;
}

export interface ShoppingCategoryData {
  name: string;
  items: ShoppingItemData[];
}

export type TabId = 'meals' | 'tracker' | 'shopping' | 'tips' | 'profile';

// Onboarding types
export interface OnboardingData {
  // Step 1: Personal
  name: string;
  age: number;
  gender: string;
  country: string;
  city: string;
  // Step 2: Body
  weightKg: number;
  heightCm: number;
  targetWeightKg: number;
  // Step 3: Diet
  mealPreference: string;
  cuisinePreferences: string[];
  mealsPerDay: number;
  eatingWindow: string;
  // Step 4: Allergies
  allergies: string[];
  allergyOther: string;
  // Step 5: Preferred
  preferredIngredients: string[];
  // Step 6: Avoid
  avoidIngredients: string[];
  avoidOther: string;
  // Step 7: Goals
  primaryGoal: string;
  dietIntensity: string;
  activityLevel: string;
  healthConditions: string[];
  wakeUpTime: string;
  sleepTime: string;
  cookingStyle: string;
  kitchenEquipment: string[];
  weeklyBudget: number | null;
  budgetCurrency: string;
  waterIntakeGoal: number;
}

// Weight tracking types
export interface WeightLog {
  id: string;
  weightKg: number;
  loggedAt: string;
  note: string;
}

export interface WeightProjectionPoint {
  date: string;
  weightKg: number;
}

export interface ChartPoint {
  date: string;
  projected?: number;
  actual?: number;
  isToday?: boolean;
  isGoal?: boolean;
}

export type TimeRange = '1M' | '3M' | '6M' | 'all';

export interface UserProfile extends OnboardingData {
  id: string;
  userId: string;
  tdee: number;
  targetCalories: number;
  proteinTarget: number;
  fatTarget: number;
  carbTarget: number;
  fibreTarget: number;
  bmi: number;
  mealPlanCustomInstructions?: string;
}
