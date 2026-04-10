import { useAppStore } from '../store/appStore';
import { MealState } from '../types';

const MEAL_ICONS = ['🌅', '☀️', '🍎', '🌙', '🥗'];
const MEAL_LABELS_FALLBACK = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Snack 2'];

interface MealRowProps {
  dayIndex: number;
  mealState: MealState;
  onToggle: () => void;
}

export function MealRow({ dayIndex, mealState, onToggle }: MealRowProps) {
  const { planDays } = useAppStore();
  const day = planDays[dayIndex];
  const meal = day?.meals?.[mealState.mealIndex];
  if (!meal) return null;

  const { mealIndex, eaten } = mealState;

  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-97 card-glow ${
        eaten
          ? 'bg-success-fill border border-success/30'
          : 'bg-surface border border-border hover:bg-elevated'
      }`}
    >
      <span className="text-xl">{MEAL_ICONS[mealIndex] || '🍽️'}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-sans font-medium truncate ${eaten ? 'line-through text-dimmed' : 'text-primary'}`}>
          {meal.name}
        </p>
        <p className="text-xs text-secondary font-sans">
          {meal.type || MEAL_LABELS_FALLBACK[mealIndex] || 'Meal'} · <span className="font-mono">{meal.calories}</span> kcal
        </p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        eaten ? 'bg-success border-success' : 'border-border bg-surface'
      }`}>
        {eaten && <span className="text-white text-xs font-bold">✓</span>}
      </div>
    </div>
  );
}
