import { create } from 'zustand';
import { TabId, DayTrackerState, TrackerStats, ShoppingCategoryData, DayPlan, UserProfile } from '../types';

interface AppState {
  activeTab: TabId;
  selectedDayIndex: number | null;
  calendarContextDate: string | null;

  // Plan data
  planDays: DayPlan[];
  isGenerated: boolean;
  mealsPerDay: number;

  // Tracker data
  weekData: DayTrackerState[];
  stats: TrackerStats | null;
  weekStart: string | null;

  // Shopping data
  shoppingCategories: ShoppingCategoryData[];
  totalItems: number;
  boughtItems: number;
  isShoppingGenerated: boolean;
  peopleCount: number;

  // Profile
  profile: UserProfile | null;

  // Actions
  setActiveTab: (tab: TabId) => void;
  setSelectedDayIndex: (index: number | null) => void;
  setCalendarContextDate: (date: string | null) => void;
  setPlanDays: (days: DayPlan[], isGenerated: boolean) => void;
  setMealsPerDay: (n: number) => void;
  setWeekData: (data: DayTrackerState[]) => void;
  setStats: (stats: TrackerStats) => void;
  setWeekStart: (date: string) => void;
  toggleMealEaten: (date: string, mealIndex: number, eaten: boolean) => void;
  setShoppingData: (categories: ShoppingCategoryData[], total: number, bought: number, isGenerated: boolean, peopleCount: number) => void;
  toggleShoppingItem: (key: string, bought: boolean) => void;
  resetShopping: () => void;
  setPeopleCount: (n: number) => void;
  setProfile: (profile: UserProfile | null) => void;
  navigateToMealsFromTracker: (dayIndex: number, date: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'meals',
  selectedDayIndex: null,
  calendarContextDate: null,
  planDays: [],
  isGenerated: false,
  mealsPerDay: 4,
  weekData: [],
  stats: null,
  weekStart: null,
  shoppingCategories: [],
  totalItems: 0,
  boughtItems: 0,
  isShoppingGenerated: false,
  peopleCount: 1,
  profile: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedDayIndex: (selectedDayIndex) => set({ selectedDayIndex }),
  setCalendarContextDate: (calendarContextDate) => set({ calendarContextDate }),
  setPlanDays: (planDays, isGenerated) => set({ planDays, isGenerated }),
  setMealsPerDay: (mealsPerDay) => set({ mealsPerDay }),
  setWeekData: (weekData) => set({ weekData }),
  setStats: (stats) => set({ stats }),
  setWeekStart: (weekStart) => set({ weekStart }),

  toggleMealEaten: (date, mealIndex, eaten) =>
    set((state) => ({
      weekData: state.weekData.map((day) =>
        day.date === date
          ? { ...day, meals: day.meals.map((m) => m.mealIndex === mealIndex ? { ...m, eaten } : m) }
          : day
      )
    })),

  setShoppingData: (shoppingCategories, totalItems, boughtItems, isShoppingGenerated, peopleCount) =>
    set({ shoppingCategories, totalItems, boughtItems, isShoppingGenerated, peopleCount }),

  toggleShoppingItem: (key, bought) =>
    set((state) => ({
      boughtItems: state.boughtItems + (bought ? 1 : -1),
      shoppingCategories: state.shoppingCategories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => item.key === key ? { ...item, bought } : item)
      }))
    })),

  resetShopping: () =>
    set((state) => ({
      boughtItems: 0,
      shoppingCategories: state.shoppingCategories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({ ...item, bought: false }))
      }))
    })),

  setPeopleCount: (peopleCount) => set({ peopleCount }),
  setProfile: (profile) => set({ profile }),

  navigateToMealsFromTracker: (dayIndex, date) =>
    set({ activeTab: 'meals', selectedDayIndex: dayIndex, calendarContextDate: date })
}));
