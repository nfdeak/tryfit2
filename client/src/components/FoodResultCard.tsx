import { FoodResult } from '../types';

interface FoodResultCardProps {
  food: FoodResult;
  onSelect: (food: FoodResult) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  open_food_facts: 'Open Food Facts',
  usda: 'USDA',
  ai_estimate: 'AI Estimate',
};

export function FoodResultCard({ food, onSelect }: FoodResultCardProps) {
  const macros = food.perServing;
  const isAI = food.isAiEstimate;

  return (
    <div
      onClick={() => onSelect(food)}
      className={`rounded-xl border p-3.5 cursor-pointer transition-all active:scale-[0.98] ${
        isAI
          ? 'bg-violet-fill/30 border-violet/20 hover:border-violet/40'
          : 'bg-surface border-border hover:border-accent/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-sans font-semibold text-primary truncate">
            {isAI && <span className="mr-1">✨</span>}
            {food.name}
          </h4>
          <p className="text-xs text-secondary font-sans mt-0.5">
            Per {food.defaultServing.label}
            {food.defaultServing.grams !== 100 && ` (~${food.defaultServing.grams}g)`}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(food); }}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-lg font-bold hover:bg-accent/20 transition-colors"
        >
          +
        </button>
      </div>

      <div className="flex gap-1.5 mt-2.5">
        <MacroBadge value={`${Math.round(macros.calories)}`} label="kcal" color="text-primary" bg="bg-primary/[0.08]" />
        <MacroBadge value={`${macros.protein}g`} label="P" color="text-success" bg="bg-success-fill" />
        <MacroBadge value={`${macros.carbs}g`} label="C" color="text-accent" bg="bg-accent-fill" />
        <MacroBadge value={`${macros.fat}g`} label="F" color="text-violet" bg="bg-violet-fill" />
        <MacroBadge value={`${macros.fibre}g`} label="Fi" color="text-fibre" bg="bg-fibre-fill" />
      </div>

      <div className="flex items-center gap-1.5 mt-2">
        <span className={`text-[10px] font-sans px-1.5 py-0.5 rounded-full ${
          isAI ? 'bg-violet/10 text-violet' : 'bg-elevated text-secondary'
        }`}>
          {SOURCE_LABELS[food.source] || food.source}
        </span>
        {isAI && (
          <span className="text-[10px] text-violet/70 font-sans">
            Estimated — accuracy may vary
          </span>
        )}
      </div>
    </div>
  );
}

function MacroBadge({ value, label, color, bg }: { value: string; label: string; color: string; bg: string }) {
  return (
    <div className={`flex-1 text-center rounded-lg py-1 ${bg}`}>
      <p className={`text-[10px] font-semibold font-mono ${color}`}>{value}</p>
      <p className="text-[8px] text-secondary font-sans">{label}</p>
    </div>
  );
}
