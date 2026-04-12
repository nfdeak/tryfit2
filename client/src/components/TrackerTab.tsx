import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar } from './Calendar';
import { MealRow } from './MealRow';
import { useTracker } from '../hooks/useTracker';
import { useAppStore } from '../store/appStore';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { ErrorBoundary } from './ErrorBoundary';

export function TrackerTab() {
  const { weekData, stats, weekStart, toggleMeal } = useTracker();
  const { navigateToMealsFromTracker, mealsPerDay } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedDayData = selectedDate ? weekData.find(d => d.date === selectedDate) : null;
  const selectedDayIndex = selectedDayData ? selectedDayData.dayIndex : null;

  const eatenCount = selectedDayData?.meals.filter(m => m.eaten).length ?? 0;
  const allEaten = eatenCount === mealsPerDay;

  const handleMarkAll = () => {
    if (!selectedDayData) return;
    selectedDayData.meals.forEach(m => {
      if (!m.eaten) toggleMeal(selectedDayData.date, m.mealIndex, false);
    });
  };

  const handleUnmarkAll = () => {
    if (!selectedDayData) return;
    selectedDayData.meals.forEach(m => {
      if (m.eaten) toggleMeal(selectedDayData.date, m.mealIndex, true);
    });
  };

  // Ensure adherence value is a primitive number (not an object like {code, message})
  const adherenceValue = typeof stats?.adherence === 'number' ? stats.adherence : 0;
  const adherenceData = [{ name: 'adherence', value: adherenceValue, fill: '#E8845A' }];

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {/* Stats row — ensure all values are primitives */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard icon="🍽️" label="Eaten" value={String(typeof stats?.eaten === 'number' ? stats.eaten : 0)} />
        <StatCard icon="📊" label="Adherence" value={`${typeof stats?.adherence === 'number' ? stats.adherence : 0}%`} highlight />
        <StatCard icon="🔥" label="Streak" value={`${typeof stats?.streak === 'number' ? stats.streak : 0}d`} />
        <StatCard icon="⏳" label="Left" value={String(typeof stats?.remaining === 'number' ? stats.remaining : mealsPerDay * 7)} />
      </div>

      {/* Adherence chart */}
      {stats && stats.eaten > 0 && (
        <div className="bg-surface rounded-2xl p-4 flex items-center gap-4 border border-border card-glow">
          <ErrorBoundary fallback={<div className="w-20 h-20" />}>
            <div className="w-20 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={adherenceData} startAngle={90} endAngle={90 - 360 * (adherenceValue / 100)}>
                  <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#2A2D3E' }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </ErrorBoundary>
          <div>
            <p className="text-primary font-display font-bold text-3xl">{adherenceValue}<span className="text-lg text-secondary">%</span></p>
            <p className="text-secondary text-sm font-sans">Week adherence</p>
            <p className="text-dimmed text-xs font-sans mt-0.5">{typeof stats.eaten === 'number' ? stats.eaten : 0} of {typeof stats.total === 'number' ? stats.total : 0} meals tracked</p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div>
        <h2 className="font-display font-bold text-primary text-lg mb-2">This Week</h2>
        <Calendar
          weekStart={weekStart}
          weekData={weekData}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Selected day card */}
      {selectedDayData && selectedDayIndex !== null && (
        <div className="bg-surface rounded-2xl p-4 space-y-4 border border-border card-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dimmed text-xs font-sans uppercase tracking-wide">
                Day {selectedDayIndex + 1} of 7
              </p>
              <h3 className="font-display font-bold text-primary text-xl">
                {format(parseISO(selectedDayData.date), 'EEEE, MMM d')}
              </h3>
            </div>
            <div className={`text-sm font-semibold font-sans px-3 py-1 rounded-full ${
              allEaten ? 'bg-success-fill text-success' : 'bg-elevated text-secondary'
            }`}>
              {eatenCount}/{mealsPerDay} eaten
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-sans text-secondary">
              <span>Meals eaten</span>
              <span className="font-mono">{Math.round(eatenCount / mealsPerDay * 100)}%</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-success to-success/70 rounded-full progress-fill"
                style={{ width: `${(eatenCount / mealsPerDay) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigateToMealsFromTracker(selectedDayIndex, selectedDayData.date)}
              className="flex-1 bg-accent text-white font-semibold font-sans py-2.5 rounded-[14px] text-sm active:scale-95 transition-all"
            >
              View Meal Plan
            </button>
            <button
              onClick={allEaten ? handleUnmarkAll : handleMarkAll}
              className="flex-1 bg-elevated text-primary font-semibold font-sans py-2.5 rounded-[14px] text-sm active:scale-95 transition-all hover:bg-elevated/80 border border-border"
            >
              {allEaten ? 'Unmark All' : 'Mark All Eaten'}
            </button>
          </div>
        </div>
      )}

      {/* Selected day meal rows */}
      {selectedDayData && selectedDayIndex !== null && (
        <div className="space-y-2">
          <h3 className="font-sans font-semibold text-primary text-sm px-0.5">Meals</h3>
          {selectedDayData.meals.map((mealState) => (
            <MealRow
              key={mealState.mealIndex}
              dayIndex={selectedDayIndex}
              mealState={mealState}
              onToggle={() => toggleMeal(selectedDayData.date, mealState.mealIndex, mealState.eaten)}
            />
          ))}
        </div>
      )}

      {!selectedDate && (
        <div className="text-center py-6">
          <p className="text-secondary text-sm font-sans">Tap a plan day on the calendar to view details</p>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-2.5 text-center border card-glow ${highlight ? 'bg-accent-fill border-accent/30' : 'bg-surface border-border'}`}>
      <div className="text-lg mb-0.5">{icon}</div>
      <p className={`font-bold font-mono text-base leading-none ${highlight ? 'text-accent' : 'text-primary'}`}>{value}</p>
      <p className="text-xs font-sans mt-0.5 text-secondary">{label}</p>
    </div>
  );
}
