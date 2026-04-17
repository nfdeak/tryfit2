import { useAppStore } from '../store/appStore';
import { useMealReplacerStore } from '../store/mealReplacerStore';
import { MealState } from '../types';

const MEAL_ICONS = ['🌅', '☀️', '🍎', '🌙', '🥗'];
const MEAL_LABELS_FALLBACK = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Snack 2'];

interface MealRowProps {
  dayIndex: number;
  mealState: MealState;
  date: string;
  onToggle: () => void;
}

export function MealRow({ dayIndex, mealState, date, onToggle }: MealRowProps) {
  const { planDays } = useAppStore();
  const { replacements } = useMealReplacerStore();
  const day = planDays[dayIndex];
  const meal = day?.meals?.[mealState.mealIndex];
  if (!meal) return null;

  const { mealIndex, eaten } = mealState;
  const repKey = `${date}-${mealIndex}`;
  const replacement = replacements[repKey];
  const isReplaced = !!replacement;

  const displayName = isReplaced ? replacement.foodName : meal.name;
  const displayCalories = isReplaced ? Math.round(replacement.calories) : meal.calories;

  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-97 card-glow ${
        isReplaced
          ? 'bg-amber-500/5 border border-amber-500/20'
          : eaten
            ? 'bg-success-fill border border-success/30'
            : 'bg-surface border border-border hover:bg-elevated'
      }`}
    >
      <span className="text-xl">{isReplaced ? '✏️' : (MEAL_ICONS[mealIndex] || '🍽️')}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-sans font-medium truncate ${eaten && !isReplaced ? 'line-through text-dimmed' : 'text-primary'}`}>
          {displayName}
        </p>
        <p className="text-xs text-secondary font-sans">
          {isReplaced ? (
            <>
              <span className="text-amber-400 font-medium">Replaced</span> · <span className="font-mono">{displayCalories}</span> kcal
            </>
          ) : (
            <>
              {meal.type || MEAL_LABELS_FALLBACK[mealIndex] || 'Meal'} · <span className="font-mono">{displayCalories}</span> kcal
            </>
          )}
        </p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        isReplaced
          ? 'bg-amber-500 border-amber-500'
          : eaten
            ? 'bg-success border-success'
            : 'border-border bg-surface'
      }`}>
        {(eaten || isReplaced) && <span className="text-white text-xs font-bold">✓</span>}
      </div>
    </div>
  );
}
