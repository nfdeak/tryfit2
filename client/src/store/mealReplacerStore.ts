import { create } from 'zustand';
import axios from 'axios';
import { FoodResult, MealReplacement, MealTarget, ServingSize, FoodMacros, RecentFoodLog } from '../types';

type Screen = 'search' | 'results' | 'quantity' | 'ai';

interface MealReplacerState {
  isOpen: boolean;
  currentScreen: Screen;
  target: MealTarget | null;

  searchQuery: string;
  searchResults: FoodResult[];
  isSearching: boolean;

  selectedFood: FoodResult | null;
  selectedServing: ServingSize | null;
  quantity: number;
  computedMacros: FoodMacros | null;

  // Replacements keyed by "YYYY-MM-DD-mealIndex"
  replacements: Record<string, MealReplacement>;
  recentFoods: RecentFoodLog[];
  note: string;

  openReplacer: (target: MealTarget) => void;
  closeReplacer: () => void;
  setScreen: (s: Screen) => void;
  setSearchQuery: (q: string) => void;
  setSearchResults: (results: FoodResult[]) => void;
  setIsSearching: (v: boolean) => void;
  selectFood: (food: FoodResult) => void;
  setQuantity: (n: number) => void;
  setServing: (s: ServingSize) => void;
  setNote: (n: string) => void;
  updateComputedMacros: () => void;

  submitReplacement: () => Promise<void>;
  undoReplacement: (date: string, mealIndex: number) => Promise<void>;
  fetchReplacementsForWeek: () => Promise<void>;
  fetchRecentFoods: () => Promise<void>;
  setReplacements: (replacements: MealReplacement[]) => void;
}

function computeMacros(food: FoodResult, serving: ServingSize, quantity: number): FoodMacros {
  const factor = (serving.grams / 100) * quantity;
  return {
    calories: Math.round(food.per100g.calories * factor),
    protein: Math.round(food.per100g.protein * factor * 10) / 10,
    carbs: Math.round(food.per100g.carbs * factor * 10) / 10,
    fat: Math.round(food.per100g.fat * factor * 10) / 10,
    fibre: Math.round(food.per100g.fibre * factor * 10) / 10,
  };
}

function repKey(date: string, mealIndex: number): string {
  return `${date}-${mealIndex}`;
}

export const useMealReplacerStore = create<MealReplacerState>((set, get) => ({
  isOpen: false,
  currentScreen: 'search',
  target: null,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  selectedFood: null,
  selectedServing: null,
  quantity: 1,
  computedMacros: null,
  replacements: {},
  recentFoods: [],
  note: '',

  openReplacer: (target) =>
    set({
      isOpen: true,
      currentScreen: 'search',
      target,
      searchQuery: '',
      searchResults: [],
      selectedFood: null,
      selectedServing: null,
      quantity: 1,
      computedMacros: null,
      note: '',
    }),

  closeReplacer: () =>
    set({
      isOpen: false,
      currentScreen: 'search',
      target: null,
      searchQuery: '',
      searchResults: [],
      selectedFood: null,
      selectedServing: null,
      quantity: 1,
      computedMacros: null,
      note: '',
    }),

  setScreen: (currentScreen) => set({ currentScreen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setNote: (note) => set({ note }),

  selectFood: (food) => {
    const serving = food.defaultServing;
    const macros = computeMacros(food, serving, 1);
    set({
      selectedFood: food,
      selectedServing: serving,
      quantity: 1,
      computedMacros: macros,
      currentScreen: 'quantity',
    });
  },

  setQuantity: (quantity) => {
    const { selectedFood, selectedServing } = get();
    if (selectedFood && selectedServing) {
      const macros = computeMacros(selectedFood, selectedServing, quantity);
      set({ quantity, computedMacros: macros });
    } else {
      set({ quantity });
    }
  },

  setServing: (serving) => {
    const { selectedFood, quantity } = get();
    if (selectedFood) {
      const macros = computeMacros(selectedFood, serving, quantity);
      set({ selectedServing: serving, computedMacros: macros });
    } else {
      set({ selectedServing: serving });
    }
  },

  updateComputedMacros: () => {
    const { selectedFood, selectedServing, quantity } = get();
    if (selectedFood && selectedServing) {
      const macros = computeMacros(selectedFood, selectedServing, quantity);
      set({ computedMacros: macros });
    }
  },

  submitReplacement: async () => {
    const { target, selectedFood, selectedServing, quantity, computedMacros, note, replacements } = get();
    if (!target || !selectedFood || !computedMacros || !selectedServing) return;

    const body = {
      date: target.date,
      dayIndex: target.dayIndex,
      mealIndex: target.mealIndex,
      foodName: selectedFood.name,
      foodSource: selectedFood.source,
      foodExternalId: selectedFood.id,
      servingSize: selectedServing.label,
      servingQty: quantity,
      servingGrams: selectedServing.grams * quantity,
      calories: computedMacros.calories,
      proteinG: computedMacros.protein,
      carbsG: computedMacros.carbs,
      fatG: computedMacros.fat,
      fibreG: computedMacros.fibre,
      note: note || '',
      isAiEstimate: selectedFood.isAiEstimate,
    };

    const res = await axios.post('/api/meals/replace', body, { withCredentials: true });
    const replacement = res.data.replacement as MealReplacement;
    const key = repKey(target.date, target.mealIndex);

    set({
      replacements: { ...replacements, [key]: replacement },
      isOpen: false,
      currentScreen: 'search',
      target: null,
      selectedFood: null,
      selectedServing: null,
      quantity: 1,
      computedMacros: null,
      note: '',
    });
  },

  undoReplacement: async (date, mealIndex) => {
    const key = repKey(date, mealIndex);
    const { replacements } = get();
    const rep = replacements[key];
    if (!rep) return;

    // Optimistic update
    const newReps = { ...replacements };
    delete newReps[key];
    set({ replacements: newReps });

    try {
      await axios.delete(`/api/meals/replace/${rep.id}`, { withCredentials: true });
    } catch {
      // Revert on failure
      set({ replacements: { ...get().replacements, [key]: rep } });
    }
  },

  fetchReplacementsForWeek: async () => {
    try {
      const res = await axios.get('/api/meals/replacements/week', { withCredentials: true });
      const list = (res.data.replacements || []) as MealReplacement[];
      const map: Record<string, MealReplacement> = {};
      for (const r of list) {
        map[repKey(r.date, r.mealIndex)] = r;
      }
      set({ replacements: map });
    } catch {
      // silent
    }
  },

  fetchRecentFoods: async () => {
    try {
      const res = await axios.get('/api/food/recent', { withCredentials: true });
      set({ recentFoods: res.data.recent || [] });
    } catch {
      // silent
    }
  },

  setReplacements: (list) => {
    const map: Record<string, MealReplacement> = {};
    for (const r of list) {
      map[repKey(r.date, r.mealIndex)] = r;
    }
    set({ replacements: map });
  },
}));
