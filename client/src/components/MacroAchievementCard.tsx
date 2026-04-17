import { format, parseISO } from 'date-fns';
import { Meal, MealReplacement, UserProfile } from '../types';

interface Props {
  meals: Meal[];
  eatenMask: boolean[];           // eatenMask[mealIdx] = true if that meal is eaten
  replacements: Record<string, MealReplacement | undefined>; // key = `${date}-${mealIdx}`
  date: string;
  profile: UserProfile;
  eatenCount: number;
  mealsPerDay: number;
}

interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

function computeConsumed(
  meals: Meal[],
  eatenMask: boolean[],
  replacements: Record<string, MealReplacement | undefined>,
  date: string
): Macros {
  return meals.reduce(
    (acc, meal, idx) => {
      if (!eatenMask[idx]) return acc;
      const rep = replacements[`${date}-${idx}`];
      return {
        calories: acc.calories + (rep ? rep.calories : meal.calories || 0),
        protein: acc.protein + (rep ? rep.proteinG : meal.protein || 0),
        carbs: acc.carbs + (rep ? rep.carbsG : meal.carbs || 0),
        fat: acc.fat + (rep ? rep.fatG : meal.fat || 0),
        fibre: acc.fibre + (rep ? rep.fibreG : meal.fibre ?? 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
  );
}

interface BarProps {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  isCalories?: boolean;
}

function MacroBar({ label, consumed, target, unit, isCalories }: BarProps) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const over = consumed > target;
  const overCalSevere = isCalories && consumed > target * 1.2;

  const fillColor = overCalSevere ? '#DC2626' : over ? '#F0B429' : '#4CAF82';
  const numColor = overCalSevere ? 'text-red-500' : over ? 'text-amber-400' : 'text-primary';

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-sans text-secondary w-14 flex-shrink-0">{label}</span>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: 5, backgroundColor: '#2A2D3E' }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: fillColor,
            borderRadius: 9999,
            transition: 'width 300ms ease',
          }}
        />
      </div>
      <span className={`text-[12px] font-mono flex-shrink-0 w-24 text-right ${numColor}`}>
        {isCalories
          ? `${Math.round(consumed).toLocaleString()} / ${Math.round(target).toLocaleString()} kcal`
          : `${Math.round(consumed)}${unit} / ${Math.round(target)}${unit}`}
      </span>
    </div>
  );
}

export function MacroAchievementCard({
  meals, eatenMask, replacements, date, profile, eatenCount, mealsPerDay
}: Props) {
  const today = new Date().toISOString().split('T')[0];
  // Don't show for future dates
  if (date > today) return null;

  const consumed = computeConsumed(meals, eatenMask, replacements, date);
  const targets: Macros = {
    calories: profile.targetCalories,
    protein: profile.proteinTarget,
    carbs: profile.carbTarget,
    fat: profile.fatTarget,
    fibre: profile.fibreTarget,
  };

  const noMealsEaten = eatenCount === 0;
  const calRemaining = targets.calories - consumed.calories;
  const calOver = calRemaining < 0;

  const dateLabel = date === today ? 'Today' : format(parseISO(date), 'd MMM');

  return (
    <div
      className="rounded-2xl border border-border card-glow"
      style={{ backgroundColor: '#1A1D27', padding: '14px 16px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold font-sans text-primary">Today's Macros</span>
        <span className="text-[11px] font-sans text-secondary">
          {dateLabel} · {eatenCount}/{mealsPerDay} eaten
        </span>
      </div>

      {noMealsEaten ? (
        <p className="text-xs text-dimmed font-sans text-center py-2">
          Log meals to track your macros
        </p>
      ) : (
        <div className="space-y-2">
          <MacroBar label="Calories" consumed={consumed.calories} target={targets.calories} unit="" isCalories />
          <MacroBar label="Protein" consumed={consumed.protein} target={targets.protein} unit="g" />
          <MacroBar label="Carbs" consumed={consumed.carbs} target={targets.carbs} unit="g" />
          <MacroBar label="Fat" consumed={consumed.fat} target={targets.fat} unit="g" />
          <MacroBar label="Fibre" consumed={consumed.fibre} target={targets.fibre} unit="g" />
        </div>
      )}

      {!noMealsEaten && (
        <p className={`text-xs font-sans mt-3 font-medium ${calOver ? 'text-amber-400' : 'text-dimmed'}`}>
          {calOver
            ? `${Math.round(-calRemaining).toLocaleString()} kcal over target`
            : `${Math.round(calRemaining).toLocaleString()} kcal remaining`}
        </p>
      )}
    </div>
  );
}
