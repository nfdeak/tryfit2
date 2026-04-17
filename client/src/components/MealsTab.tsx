import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { useMealReplacerStore } from '../store/mealReplacerStore';
import { useTracker } from '../hooks/useTracker';
import { usePlan } from '../hooks/usePlan';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useLongPress } from '../hooks/useLongPress';
import { format, parseISO } from 'date-fns';
import { Meal, MealTarget } from '../types';
import { ReplacedMealCard } from './ReplacedMealCard';
import { MealReplacerSheet } from './MealReplacerSheet';

const MEAL_ICONS = ['🌅', '☀️', '🍎', '🌙', '🥗'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MealsTab() {
  const { selectedDayIndex, calendarContextDate, setSelectedDayIndex, setCalendarContextDate, setActiveTab, mealsPerDay } = useAppStore();
  const { weekData, toggleMeal } = useTracker();
  const { planDays } = usePlan();
  const { replacements, openReplacer, undoReplacement, fetchReplacementsForWeek } = useMealReplacerStore();
  const [activeDayIdx, setActiveDayIdx] = useState(selectedDayIndex ?? 0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set());
  const [activeSwipeIdx, setActiveSwipeIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchReplacementsForWeek();
  }, [fetchReplacementsForWeek]);

  useEffect(() => {
    if (selectedDayIndex !== null) {
      setActiveDayIdx(selectedDayIndex);
      if (tabsRef.current) {
        const btn = tabsRef.current.children[selectedDayIndex] as HTMLElement;
        btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedDayIndex]);

  if (planDays.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-4xl">🍽️</span>
          <p className="text-secondary font-sans mt-3">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  const day = planDays[activeDayIdx];
  if (!day) return null;

  const meals: Meal[] = day.meals || [];
  const dayTrackerData = weekData[activeDayIdx];
  const currentDate = dayTrackerData?.date || '';

  // Compute day totals with replacements factored in
  const getDayTotals = () => {
    return meals.reduce(
      (acc, meal, mealIdx) => {
        const key = `${currentDate}-${mealIdx}`;
        const rep = replacements[key];
        return {
          calories: acc.calories + (rep ? rep.calories : (meal.calories || 0)),
          protein: acc.protein + (rep ? rep.proteinG : (meal.protein || 0)),
          carbs: acc.carbs + (rep ? rep.carbsG : (meal.carbs || 0)),
          fat: acc.fat + (rep ? rep.fatG : (meal.fat || 0)),
          fibre: acc.fibre + (rep ? rep.fibreG : (meal.fibre ?? 0)),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
    );
  };

  const totals = getDayTotals();

  const handleDayChange = (idx: number) => {
    setActiveDayIdx(idx);
    setActiveSwipeIdx(null);
    if (selectedDayIndex !== null) {
      setSelectedDayIndex(null);
      setCalendarContextDate(null);
    }
  };

  const getMealEaten = (mealIndex: number) => dayTrackerData?.meals[mealIndex]?.eaten ?? false;
  const handleToggle = (mealIndex: number) => {
    if (!dayTrackerData) return;
    toggleMeal(dayTrackerData.date, mealIndex, getMealEaten(mealIndex));
  };

  const eatenCount = dayTrackerData?.meals.filter(m => m.eaten).length ?? 0;

  const toggleExpand = (mealIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMeals(prev => {
      const next = new Set(prev);
      if (next.has(mealIdx)) next.delete(mealIdx);
      else next.add(mealIdx);
      return next;
    });
  };

  const handleOpenReplacer = (mealIdx: number) => {
    const meal = meals[mealIdx];
    if (!meal || !currentDate) return;
    const mealType = meal.type || ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Snack 2'][mealIdx] || 'Meal';
    const target: MealTarget = {
      date: currentDate,
      dayIndex: activeDayIdx,
      mealIndex: mealIdx,
      mealName: `${mealType} · ${day.label}`,
    };
    openReplacer(target);
    setActiveSwipeIdx(null);
  };

  return (
    <div className="flex flex-col h-full">
      {calendarContextDate && (
        <div className="bg-accent-fill border-b border-border px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-accent text-sm">📅</span>
            <span className="text-sm font-medium font-sans text-primary">
              {format(parseISO(calendarContextDate), 'EEEE, MMM d')}
            </span>
          </div>
          <button onClick={() => { setActiveTab('tracker'); setCalendarContextDate(null); setSelectedDayIndex(null); }}
            className="text-accent text-sm font-semibold font-sans flex items-center gap-1">← Calendar</button>
        </div>
      )}

      <div ref={tabsRef} className="flex overflow-x-auto bg-surface border-b border-border scrollbar-hide gap-1 px-3 py-2" style={{ scrollbarWidth: 'none' }}>
        {DAY_LABELS.map((label, idx) => {
          const dayData = weekData[idx];
          const ec = dayData?.meals.filter(m => m.eaten).length ?? 0;
          const isActive = activeDayIdx === idx;
          return (
            <button key={idx} onClick={() => handleDayChange(idx)}
              className={`flex-shrink-0 flex flex-col items-center px-3.5 py-1.5 rounded-xl transition-all tab-transition font-sans text-sm font-medium ${
                isActive ? 'bg-elevated text-primary' : 'text-secondary hover:bg-elevated/50 hover:text-primary'}`}>
              <span>{label}</span>
              {ec > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: mealsPerDay }, (_, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${
                      i < ec ? 'bg-success' : isActive ? 'bg-primary/20' : 'bg-dimmed/40'}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-xl font-bold text-primary">{day.label}</h2>
          <span className="text-xs font-sans text-secondary bg-elevated px-2.5 py-1 rounded-full border border-border">
            {eatenCount}/{mealsPerDay} eaten
          </span>
        </div>

        {/* Day Total Macros */}
        <div className="bg-surface rounded-2xl p-3.5 border border-border card-glow">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-success font-bold text-base font-mono">{Math.round(totals.protein)}g</p>
              <p className="text-secondary text-[10px] font-sans">Protein</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-accent font-bold text-base font-mono">{Math.round(totals.carbs)}g</p>
              <p className="text-secondary text-[10px] font-sans">Carbs</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-violet font-bold text-base font-mono">{Math.round(totals.fat)}g</p>
              <p className="text-secondary text-[10px] font-sans">Fat</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-fibre font-bold text-base font-mono">{Math.round(totals.fibre)}g</p>
              <p className="text-secondary text-[10px] font-sans">Fibre</p>
            </div>
            <div className="w-px h-7 bg-border" />
            <div className="text-center flex-1">
              <p className="text-primary font-bold text-lg font-mono">{Math.round(totals.calories)}</p>
              <p className="text-secondary text-[10px] font-sans">kcal</p>
            </div>
          </div>
        </div>

        {meals.map((meal, mealIdx) => {
          const repKey = `${currentDate}-${mealIdx}`;
          const replacement = replacements[repKey];
          const isReplaced = !!replacement;

          return (
            <SwipeableMealCard
              key={mealIdx}
              meal={meal}
              mealIdx={mealIdx}
              eaten={getMealEaten(mealIdx)}
              isReplaced={isReplaced}
              replacement={replacement}
              isExpanded={expandedMeals.has(mealIdx)}
              isActiveSwipe={activeSwipeIdx === mealIdx}
              onToggle={() => handleToggle(mealIdx)}
              onExpand={(e) => toggleExpand(mealIdx, e)}
              onReplace={() => handleOpenReplacer(mealIdx)}
              onUndo={() => undoReplacement(currentDate, mealIdx)}
              onSwipeReveal={() => {
                setActiveSwipeIdx(prev => prev === mealIdx ? null : mealIdx);
              }}
              onSwipeReset={() => {
                if (activeSwipeIdx === mealIdx) setActiveSwipeIdx(null);
              }}
            />
          );
        })}

        <div className="h-4" />
      </div>

      <MealReplacerSheet />
    </div>
  );
}

// ── Swipeable Meal Card wrapper ─────────────────────────────────────────
interface SwipeableMealCardProps {
  meal: Meal;
  mealIdx: number;
  eaten: boolean;
  isReplaced: boolean;
  replacement: any;
  isExpanded: boolean;
  isActiveSwipe: boolean;
  onToggle: () => void;
  onExpand: (e: React.MouseEvent) => void;
  onReplace: () => void;
  onUndo: () => void;
  onSwipeReveal: () => void;
  onSwipeReset: () => void;
}

function SwipeableMealCard({
  meal, mealIdx, eaten, isReplaced, replacement, isExpanded, isActiveSwipe,
  onToggle, onExpand, onReplace, onUndo, onSwipeReveal, onSwipeReset,
}: SwipeableMealCardProps) {
  const icon = MEAL_ICONS[mealIdx] || '🍽️';
  const mealType = meal.type || ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Snack 2'][mealIdx] || 'Meal';

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const swipe = useSwipeGesture(() => {
    onSwipeReveal();
  });

  const longPress = useLongPress(() => {
    // Get approximate center of card for menu position
    setContextMenu({ x: 150, y: 40 });
  });

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null); };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [contextMenu]);

  // If another card is swiped, reset this one
  useEffect(() => {
    if (!isActiveSwipe && swipe.isRevealed) {
      swipe.reset();
    }
  }, [isActiveSwipe]);

  const hasDetails = meal.description || meal.cookingTip;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '14px' }}>
      {/* Action panel behind the card */}
      <div
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 16px',
        }}
        className="bg-[#E8845A]"
      >
        <button
          onClick={onReplace}
          className="text-white font-semibold font-sans text-sm flex items-center gap-1.5"
        >
          ✏️ Replace Meal
        </button>
        <button
          onClick={() => { swipe.reset(); onSwipeReset(); }}
          className="text-white/70 hover:text-white text-lg ml-1"
        >
          ✕
        </button>
      </div>

      {/* The actual card */}
      <div
        style={{
          transform: `translateX(${swipe.translateX}px)`,
          transition: swipe.isRevealed ? 'none' : 'transform 0.15s ease',
          position: 'relative',
          zIndex: 1,
        }}
        {...swipe.handlers}
        {...longPress.handlers}
        className={`rounded-2xl border transition-all card-glow ${
          isReplaced
            ? 'bg-amber-500/5 border-amber-500/20'
            : eaten
              ? 'bg-success-fill border-success/30'
              : 'bg-surface border-border'
        }`}
      >
        {isReplaced && replacement ? (
          <ReplacedMealCard
            replacement={replacement}
            originalMeal={meal}
            mealIcon={icon}
            mealType={mealType}
            onUndo={onUndo}
          />
        ) : (
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{icon}</span>
                  <span className="text-xs font-semibold font-sans text-secondary uppercase tracking-wide">
                    {mealType} · {meal.time}
                  </span>
                </div>
                <h3 className={`font-sans font-semibold text-sm leading-snug ${eaten ? 'line-through text-dimmed' : 'text-primary'}`}>
                  {meal.name}
                </h3>
              </div>
              <div onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all cursor-pointer ${
                eaten ? 'bg-success border-success' : 'border-border bg-surface hover:border-success/50'}`}>
                {eaten && <span className="text-white text-xs">✓</span>}
              </div>
            </div>

            {hasDetails && (
              <button onClick={onExpand}
                className="flex items-center gap-1.5 mt-2 text-xs font-sans text-accent/80 hover:text-accent transition-colors">
                <span className={`transition-transform duration-200 inline-block ${isExpanded ? 'rotate-90' : ''}`}>▸</span>
                <span>{isExpanded ? 'Hide instructions' : 'View cooking instructions'}</span>
              </button>
            )}
            {isExpanded && hasDetails && (
              <div className="mt-2 pl-1 border-l-2 border-accent/20 ml-1 space-y-1.5 animate-[fadeIn_200ms_ease]">
                {meal.description && (
                  <p className="text-xs text-secondary font-sans leading-relaxed pl-2.5">{meal.description}</p>
                )}
                {meal.cookingTip && (
                  <p className="text-xs text-accent font-sans pl-2.5 italic">💡 {meal.cookingTip}</p>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-3 pt-3 border-t border-border/60">
              <MacroPill label="Protein" value={`${meal.protein}g`} bgColor="bg-success-fill" textColor="text-success" />
              <MacroPill label="Carbs" value={`${meal.carbs}g`} bgColor="bg-accent-fill" textColor="text-accent" />
              <MacroPill label="Fat" value={`${meal.fat}g`} bgColor="bg-violet-fill" textColor="text-violet" />
              <MacroPill label="Fibre" value={`${meal.fibre ?? 0}g`} bgColor="bg-fibre-fill" textColor="text-fibre" />
              <MacroPill label="kcal" value={`${meal.calories}`} bgColor="bg-primary/[0.08]" textColor="text-primary" bold />
            </div>
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="absolute z-20 bg-elevated border border-border rounded-xl shadow-xl py-1 min-w-[200px]"
          style={{ top: contextMenu.y, left: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { setContextMenu(null); onReplace(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans text-primary hover:bg-accent/10 transition-colors"
          >
            <span>✏️</span> Replace this meal
          </button>
          <button
            onClick={() => { setContextMenu(null); onToggle(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans text-primary hover:bg-accent/10 transition-colors"
          >
            <span>✓</span> {eaten ? 'Unmark as eaten' : 'Mark as eaten'}
          </button>
        </div>
      )}
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
