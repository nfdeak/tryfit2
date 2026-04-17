import { MealReplacement, Meal } from '../types';

interface Props {
  replacement: MealReplacement;
  originalMeal: Meal;
  mealIcon: string;
  mealType: string;
  onUndo: () => void;
}

export function ReplacedMealCard({ replacement, originalMeal, mealIcon, mealType, onUndo }: Props) {
  return (
    <div className="p-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{mealIcon}</span>
            <span className="text-xs font-semibold font-sans text-secondary uppercase tracking-wide">
              {mealType} &middot; {originalMeal.time}
            </span>
          </div>
          <h3 className="font-sans font-semibold text-sm leading-snug text-primary">
            {replacement.foodName}
          </h3>
          <p className="text-xs text-dimmed font-sans italic mt-0.5">
            Replacing: {originalMeal.name}
          </p>
        </div>
        <span className="flex-shrink-0 text-[10px] font-sans font-semibold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap">
          REPLACED TODAY
        </span>
      </div>

      {/* Macro pills */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border/60">
        <MacroPill label="Protein" value={`${replacement.proteinG}g`} bgColor="bg-success-fill" textColor="text-success" />
        <MacroPill label="Carbs" value={`${replacement.carbsG}g`} bgColor="bg-accent-fill" textColor="text-accent" />
        <MacroPill label="Fat" value={`${replacement.fatG}g`} bgColor="bg-violet-fill" textColor="text-violet" />
        <MacroPill label="Fibre" value={`${replacement.fibreG}g`} bgColor="bg-fibre-fill" textColor="text-fibre" />
        <MacroPill label="kcal" value={`${Math.round(replacement.calories)}`} bgColor="bg-primary/[0.08]" textColor="text-primary" bold />
      </div>

      {/* Undo button */}
      <button
        onClick={(e) => { e.stopPropagation(); onUndo(); }}
        className="mt-2.5 text-xs font-sans text-accent/70 hover:text-accent transition-colors underline underline-offset-2"
      >
        Undo Replacement
      </button>
    </div>
  );
}

function MacroPill({ label, value, bgColor, textColor, bold }: { label: string; value: string; bgColor: string; textColor: string; bold?: boolean }) {
  return (
    <div className={`flex-1 text-center rounded-3xl py-1 ${bgColor}`}>
      <p className={`text-[11px] font-semibold font-mono ${textColor} ${bold ? 'font-bold' : ''}`}>{value}</p>
      <p className="text-[9px] text-secondary font-sans">{label}</p>
    </div>
  );
}
