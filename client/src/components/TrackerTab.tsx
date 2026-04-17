import { useState, useEffect, useCallback } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, getDaysInMonth, getDay, addDays, startOfWeek, getYear, getMonth } from 'date-fns';
import axios from 'axios';
import { useAppStore } from '../store/appStore';
import { useMealReplacerStore } from '../store/mealReplacerStore';
import { useTracker } from '../hooks/useTracker';
import { TrackerSummary, GoalCountdown } from '../types';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { ErrorBoundary } from './ErrorBoundary';

// ── Helpers ────────────────────────────────────────────────────────────────
// Use format() (local time) not toISOString() (UTC) to avoid timezone off-by-one
function getMonthStr(date: Date): string {
  return format(date, 'yyyy-MM');
}

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function getWeekStartStr(): string {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  return monday.toISOString().split('T')[0];
}

// ── TrackerTab ─────────────────────────────────────────────────────────────
export function TrackerTab() {
  const { weekData, stats, weekStart, toggleMeal } = useTracker();
  const {
    selectedDate, setSelectedDate,
    trackerCalendarMonth, setTrackerCalendarMonth,
    navigateToMealsFromTracker, mealsPerDay, planDuration
  } = useAppStore();
  const { fetchReplacementsForWeek } = useMealReplacerStore();

  const [weeklySummary, setWeeklySummary] = useState<TrackerSummary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<TrackerSummary | null>(null);
  const [goalCountdown, setGoalCountdown] = useState<GoalCountdown | null>(null);

  const today = todayStr();
  // Use format() (local time) to stay consistent with getMonthStr
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const canGoForwardMonth = trackerCalendarMonth < currentMonthStr;

  useEffect(() => {
    fetchReplacementsForWeek();
  }, [fetchReplacementsForWeek]);

  // Fetch weekly + monthly summaries + goal countdown
  useEffect(() => {
    const weekStartStr = getWeekStartStr();
    const monthStr = trackerCalendarMonth;

    Promise.allSettled([
      axios.get('/api/tracker/summary', { params: { period: 'week', weekStart: weekStartStr }, withCredentials: true }),
      axios.get('/api/tracker/summary', { params: { period: 'month', month: monthStr }, withCredentials: true }),
      axios.get('/api/tracker/goal-countdown', { withCredentials: true }),
    ]).then(([weekRes, monthRes, goalRes]) => {
      if (weekRes.status === 'fulfilled') setWeeklySummary(weekRes.value.data);
      if (monthRes.status === 'fulfilled') setMonthlySummary(monthRes.value.data);
      if (goalRes.status === 'fulfilled') setGoalCountdown(goalRes.value.data);
    });
  }, [trackerCalendarMonth]);

  // Map weekData by date for quick lookup
  const weekDataByDate: Record<string, typeof weekData[0]> = {};
  weekData.forEach(d => { weekDataByDate[d.date] = d; });

  const adherenceValue = typeof stats?.adherence === 'number' ? stats.adherence : 0;
  const adherenceData = [{ name: 'adherence', value: adherenceValue, fill: '#E8845A' }];

  const selectedDayData = weekDataByDate[selectedDate] ?? null;
  const selectedDayIndex = selectedDayData?.dayIndex ?? weekData.findIndex(d => d.date === selectedDate);

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

  // Month calendar
  const calendarMonthDate = parseISO(trackerCalendarMonth + '-01');
  const firstDayOfMonth = startOfMonth(calendarMonthDate);
  const lastDayOfMonth = endOfMonth(calendarMonthDate);
  const daysInMonth = getDaysInMonth(calendarMonthDate);
  // day-of-week of first day (0=Sun → 6=Sat, we want Mon=0)
  const firstDayWeekday = (getDay(firstDayOfMonth) + 6) % 7; // 0=Mon, 6=Sun
  const totalCells = firstDayWeekday + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const calendarCells: Array<string | null> = [
    ...Array(firstDayWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      addDays(firstDayOfMonth, i).toISOString().split('T')[0]
    )
  ];
  // Pad to complete last row
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {/* ── Weekly & Monthly Adherence ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <AdherenceCard
          label="This Week"
          eaten={weeklySummary?.eaten ?? stats?.eaten ?? 0}
          total={weeklySummary?.total ?? stats?.total ?? 0}
          pct={weeklySummary?.adherencePct ?? adherenceValue}
        />
        <AdherenceCard
          label="This Month"
          eaten={monthlySummary?.eaten ?? 0}
          total={monthlySummary?.total ?? 0}
          pct={monthlySummary?.adherencePct ?? 0}
        />
      </div>

      {/* ── Streak + Left + Radial ───────────────────────────────────── */}
      <div className="bg-surface rounded-2xl p-4 flex items-center gap-4 border border-border card-glow">
        <ErrorBoundary fallback={<div className="w-20 h-20" />}>
          <div className="w-20 h-20 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={adherenceData} startAngle={90} endAngle={90 - 360 * (adherenceValue / 100)}>
                <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#2A2D3E' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </ErrorBoundary>
        <div className="flex-1">
          <p className="text-primary font-display font-bold text-3xl">{adherenceValue}<span className="text-lg text-secondary">%</span></p>
          <p className="text-secondary text-sm font-sans">Weekly adherence</p>
          <div className="flex gap-4 mt-1.5">
            <span className="text-xs font-sans text-dimmed">
              🔥 <span className="text-primary font-semibold">{stats?.streak ?? 0}d</span> streak
            </span>
            <span className="text-xs font-sans text-dimmed">
              ⏳ <span className="text-primary font-semibold">{stats?.remaining ?? 0}</span> left
            </span>
          </div>
        </div>
      </div>

      {/* ── Goal Countdown ──────────────────────────────────────────────── */}
      {goalCountdown && (
        <div className="bg-surface rounded-2xl p-4 border border-border card-glow">
          <p className="text-dimmed text-xs font-sans uppercase tracking-wide mb-2">🎯 Goal Countdown</p>
          <p className="text-secondary text-xs font-sans mb-2">
            Target: {goalCountdown.targetWeight}kg by {format(parseISO(goalCountdown.goalDate), 'd MMMM yyyy')}
          </p>
          <div className={`rounded-xl px-4 py-2.5 text-center ${
            goalCountdown.daysLeft <= 0
              ? 'bg-success-fill'
              : goalCountdown.isUrgent
                ? 'bg-[#E8845A]/15 border border-[#E8845A]/30'
                : 'bg-elevated border border-border'
          }`}>
            <p className={`font-display font-bold text-xl ${
              goalCountdown.daysLeft <= 0 ? 'text-success' :
              goalCountdown.isUrgent ? 'text-accent' : 'text-primary'
            }`}>{goalCountdown.displayText}</p>
          </div>
          {goalCountdown.daysLeft > 0 && (
            <p className="text-dimmed text-xs font-sans mt-2 text-center">
              {goalCountdown.daysLeft > 0 && !goalCountdown.isUrgent
                ? 'You are on track. Keep going.'
                : goalCountdown.isUrgent
                  ? 'Almost there!'
                  : ''}
            </p>
          )}
        </div>
      )}

      {/* ── Month Calendar ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setTrackerCalendarMonth(getMonthStr(subMonths(calendarMonthDate, 1)))}
            className="p-1.5 rounded-lg text-primary hover:bg-elevated transition-colors"
          >
            ←
          </button>
          <h2 className="font-display font-bold text-primary text-base">
            {format(calendarMonthDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => canGoForwardMonth && setTrackerCalendarMonth(getMonthStr(addMonths(calendarMonthDate, 1)))}
            disabled={!canGoForwardMonth}
            className={`p-1.5 rounded-lg transition-colors ${canGoForwardMonth ? 'text-primary hover:bg-elevated' : 'text-dimmed/40 cursor-not-allowed'}`}
          >
            →
          </button>
        </div>

        <div className="bg-surface rounded-2xl p-3 border border-border card-glow">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <div key={d} className="text-center text-[10px] text-dimmed font-sans font-semibold py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarCells.map((date, idx) => {
              if (!date) return <div key={idx} />;
              const isFuture = date > today;
              const isToday = date === today;
              const isSelected = date === selectedDate;
              const dayData = weekDataByDate[date];
              const isPlan = !!dayData;
              const eaten = dayData?.meals.filter(m => m.eaten).length ?? 0;
              const total = mealsPerDay;

              return (
                <button
                  key={date}
                  onClick={() => { if (!isFuture) setSelectedDate(date); }}
                  disabled={isFuture}
                  className={`flex flex-col items-center py-1.5 rounded-lg transition-all ${
                    isFuture ? 'opacity-35 cursor-not-allowed' :
                    isSelected ? 'bg-accent text-white' :
                    isToday ? 'bg-accent/20' : 'hover:bg-elevated'
                  }`}
                >
                  <span className={`text-xs font-mono font-bold ${
                    isSelected ? 'text-white' : isToday ? 'text-accent' : 'text-primary'
                  }`}>
                    {format(parseISO(date), 'd')}
                  </span>
                  {isPlan && (
                    <div className="flex gap-[2px] mt-0.5">
                      {Array.from({ length: Math.min(total, 4) }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            i < eaten
                              ? isSelected ? 'bg-white' : 'bg-success'
                              : isSelected ? 'bg-white/40' : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Selected Day Detail ─────────────────────────────────────────── */}
      {selectedDate && selectedDayData && (
        <div className="bg-surface rounded-2xl p-4 space-y-4 border border-border card-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dimmed text-xs font-sans uppercase tracking-wide">
                Day {selectedDayIndex + 1} of {planDuration}
              </p>
              <h3 className="font-display font-bold text-primary text-xl">
                {format(parseISO(selectedDate), 'EEEE, MMM d')}
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
              onClick={() => navigateToMealsFromTracker(selectedDayIndex, selectedDate)}
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

      <div className="h-4" />
    </div>
  );
}

// ── AdherenceCard ──────────────────────────────────────────────────────────
function AdherenceCard({ label, eaten, total, pct }: { label: string; eaten: number; total: number; pct: number }) {
  return (
    <div className="bg-surface rounded-2xl p-3.5 border border-border card-glow">
      <p className="text-dimmed text-[10px] font-sans uppercase tracking-wide mb-1">{label}</p>
      <p className="text-primary font-display font-bold text-xl">{pct}<span className="text-sm text-secondary">%</span></p>
      <p className="text-secondary text-xs font-sans">{eaten} / {total} meals</p>
      <div className="h-1.5 bg-border rounded-full overflow-hidden mt-2">
        <div
          className="h-full bg-accent rounded-full"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
