import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useTracker } from '../hooks/useTracker';
import { usePlan } from '../hooks/usePlan';
import { format, parseISO } from 'date-fns';
import { Meal } from '../types';

const MEAL_ICONS = ['🌅', '☀️', '🍎', '🌙', '🥗'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MealsTab() {
  const { selectedDayIndex, calendarContextDate, setSelectedDayIndex, setCalendarContextDate, setActiveTab, mealsPerDay } = useAppStore();
  const { weekData, toggleMeal } = useTracker();
  const { planDays } = usePlan();
  const [activeDayIdx, setActiveDayIdx] = useState(selectedDayIndex ?? 0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set());

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

  const totalCals = day.totalCalories ?? meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = day.totalProtein ?? meals.reduce((s, m) => s + (m.protein || 0), 0);
  const totalCarbs = day.totalCarbs ?? meals.reduce((s, m) => s + (m.carbs || 0), 0);
  const totalFat = day.totalFat ?? meals.reduce((s, m) => s + (m.fat || 0), 0);
  const totalFibre = day.totalFibre ?? meals.reduce((s, m) => s + (m.fibre || 0), 0);

  const handleDayChange = (idx: number) => {
    setActiveDayIdx(idx);
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
              <p className="text-success font-bold text-base font-mono">{Math.round(totalProtein)}g</p>
              <p className="text-secondary text-[10px] font-sans">Protein</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-accent font-bold text-base font-mono">{Math.round(totalCarbs)}g</p>
              <p className="text-secondary text-[10px] font-sans">Carbs</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-violet font-bold text-base font-mono">{Math.round(totalFat)}g</p>
              <p className="text-secondary text-[10px] font-sans">Fat</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-fibre font-bold text-base font-mono">{Math.round(totalFibre)}g</p>
              <p className="text-secondary text-[10px] font-sans">Fibre</p>
            </div>
            <div className="w-px h-7 bg-border" />
            <div className="text-center flex-1">
              <p className="text-primary font-bold text-lg font-mono">{Math.round(totalCals)}</p>
              <p className="text-secondary text-[10px] font-sans">kcal</p>
            </div>
          </div>
        </div>

        {meals.map((meal, mealIdx) => {
          const eaten = getMealEaten(mealIdx);
          const icon = MEAL_ICONS[mealIdx] || '🍽️';
          const mealType = meal.type || ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Snack 2'][mealIdx] || 'Meal';
          const isExpanded = expandedMeals.has(mealIdx);
          const hasDetails = meal.description || meal.cookingTip;
          return (
            <div key={mealIdx}
              className={`rounded-2xl border transition-all card-glow ${
                eaten ? 'bg-success-fill border-success/30' : 'bg-surface border-border'}`}>
              <div className="p-4">
                {/* Top row: icon, type, name, checkbox */}
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
                  <div onClick={() => handleToggle(mealIdx)}
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all cursor-pointer ${
                    eaten ? 'bg-success border-success' : 'border-border bg-surface hover:border-success/50'}`}>
                    {eaten && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>

                {/* Collapsible cooking instructions */}
                {hasDetails && (
                  <button onClick={(e) => toggleExpand(mealIdx, e)}
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

                {/* Macro pills */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/60">
                  <MacroPill label="Protein" value={`${meal.protein}g`} bgColor="bg-success-fill" textColor="text-success" />
                  <MacroPill label="Carbs" value={`${meal.carbs}g`} bgColor="bg-accent-fill" textColor="text-accent" />
                  <MacroPill label="Fat" value={`${meal.fat}g`} bgColor="bg-violet-fill" textColor="text-violet" />
                  <MacroPill label="Fibre" value={`${meal.fibre ?? 0}g`} bgColor="bg-fibre-fill" textColor="text-fibre" />
                  <MacroPill label="kcal" value={`${meal.calories}`} bgColor="bg-primary/[0.08]" textColor="text-primary" bold />
                </div>
              </div>
            </div>
          );
        })}

        <div className="h-4" />
      </div>
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
