import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine,
  ResponsiveContainer, Tooltip, Cell,
} from 'recharts';
import { useAppStore } from '../store/appStore';

// ── Types ──────────────────────────────────────────────────────────────────
interface DailyDeltaPoint {
  day: number;
  date: string;
  delta: number;
  consumed: number;
  target: number;
  hasData: boolean;
}

interface MonthlyCalorieData {
  month: string;
  planDaysElapsed: number;
  totalPlanDaysInMonth: number;
  targetCalories: number;
  totalTargetKcal: number;
  totalConsumedKcal: number;
  deltaKcal: number;
  deltaPct: number;
  dailyAvgConsumed: number;
  dailyData: DailyDeltaPoint[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getBarColor(delta: number, targetCalories: number, hasData: boolean): string {
  if (!hasData || delta === 0) return '#2A2D3E';
  if (delta > 0) return '#DC2626';       // over — red
  if (delta < -500) return '#F0B429';    // too far under — amber
  return '#4CAF82';                       // healthy deficit — green
}

function getMonthlyInsight(deltaPct: number, daysElapsed: number): string {
  if (daysElapsed === 0) return 'Start logging meals to see your monthly calorie progress.';
  if (deltaPct < -20) return '⚠️ You are significantly under your calorie target. Ensure you are eating enough protein.';
  if (deltaPct < -5)  return '✅ You are in a healthy calorie deficit. On track for your goal.';
  if (deltaPct <= 5)  return '🎯 You are right on target for the month. Great consistency.';
  if (deltaPct <= 15) return '⚠️ Slightly over your monthly target. Try to balance the remaining days.';
  return '🚨 Significantly over target this month. Tighten up your remaining days.';
}

function fmtKcal(n: number): string {
  return Math.abs(n).toLocaleString();
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: DailyDeltaPoint = payload[0].payload;
  const dateLabel = (() => {
    try { return format(new Date(d.date + 'T12:00:00'), 'd MMMM'); } catch { return d.date; }
  })();
  const delta = d.delta;
  const deltaColor = delta > 0 ? '#DC2626' : delta < 0 ? '#4CAF82' : '#9CA3AF';

  return (
    <div style={{
      background: '#1A1D27',
      border: '1px solid #2A2D3E',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      fontFamily: 'sans-serif',
      lineHeight: 1.6,
    }}>
      <p style={{ color: '#E2E8F0', fontWeight: 700, marginBottom: 4 }}>{dateLabel}</p>
      <p style={{ color: '#9CA3AF' }}>Consumed: <span style={{ color: '#E2E8F0', fontFamily: 'DM Mono, monospace' }}>{Math.round(d.consumed).toLocaleString()}</span></p>
      <p style={{ color: '#9CA3AF' }}>Target: <span style={{ color: '#E2E8F0', fontFamily: 'DM Mono, monospace' }}>{Math.round(d.target).toLocaleString()}</span></p>
      <p style={{ color: '#9CA3AF' }}>Delta: <span style={{ color: deltaColor, fontFamily: 'DM Mono, monospace' }}>{delta > 0 ? '+' : ''}{Math.round(delta).toLocaleString()}</span></p>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 space-y-3 card-glow">
      <div className="flex justify-between items-center">
        <div className="h-4 w-40 bg-elevated rounded animate-pulse" />
        <div className="h-3 w-20 bg-elevated rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map(i => <div key={i} className="h-14 bg-elevated rounded-xl animate-pulse" />)}
      </div>
      <div className="h-3 w-32 bg-elevated rounded animate-pulse" />
      <div className="h-40 bg-elevated rounded-xl animate-pulse" />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function MonthlyCalorieChart() {
  const { trackerCalendarMonth } = useAppStore();
  const [data, setData] = useState<MonthlyCalorieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (month: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/tracker/monthly-calories', {
        params: { month },
        withCredentials: true,
      });
      setData(res.data);
    } catch {
      setError('Could not load monthly data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(trackerCalendarMonth);
  }, [trackerCalendarMonth, fetchData]);

  if (loading) return <Skeleton />;
  if (error || !data) return (
    <div className="bg-surface rounded-2xl border border-border p-4 card-glow">
      <p className="text-dimmed text-xs font-sans text-center">{error || 'No data'}</p>
    </div>
  );

  const {
    planDaysElapsed, totalPlanDaysInMonth, targetCalories,
    totalTargetKcal, totalConsumedKcal, deltaKcal, deltaPct,
    dailyAvgConsumed, dailyData, month,
  } = data;

  const noData = planDaysElapsed === 0;
  const pctConsumed = totalTargetKcal > 0 ? Math.min((totalConsumedKcal / totalTargetKcal) * 100, 100) : 0;
  const progressColor = totalConsumedKcal > totalTargetKcal * 1.05 ? '#DC2626'
    : totalConsumedKcal > totalTargetKcal ? '#F0B429'
    : '#4CAF82';

  const monthLabel = (() => {
    try { return format(new Date(month + '-01T12:00:00'), 'MMMM yyyy'); } catch { return month; }
  })();

  // Y-axis ticks — symmetric around 0
  const maxAbs = dailyData.length > 0
    ? Math.max(...dailyData.map(d => Math.abs(d.delta)), 300)
    : 300;
  const yDomain = [-Math.ceil(maxAbs / 100) * 100, Math.ceil(maxAbs / 100) * 100];

  const deficitZoneLine = -targetCalories * 0.1;

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 card-glow space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-semibold text-primary text-sm">Monthly Calorie Tracker</h3>
        <span className="text-xs text-secondary font-sans">{monthLabel}</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Consumed" value={Math.round(totalConsumedKcal).toLocaleString()} sub="kcal so far" color="text-primary" />
        <StatCard label="Target" value={Math.round(totalTargetKcal).toLocaleString()} sub="kcal so far" color="text-secondary" />
        <StatCard
          label="Delta"
          value={`${deltaKcal > 0 ? '+' : ''}${Math.round(deltaKcal).toLocaleString()}`}
          sub={deltaKcal > 0 ? 'over' : 'under'}
          color={deltaKcal > 0 ? 'text-red-400' : 'text-success'}
        />
      </div>

      {/* Progress text */}
      {!noData && (
        <p className="text-xs text-secondary font-sans">
          <span className="text-primary font-semibold font-mono">{planDaysElapsed}</span> of{' '}
          <span className="text-primary font-semibold font-mono">{totalPlanDaysInMonth}</span> plan days progressed{' '}
          <span className="text-dimmed">({Math.round((planDaysElapsed / totalPlanDaysInMonth) * 100)}%)</span>
        </p>
      )}

      {/* Bar chart */}
      {noData ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-dimmed text-xs font-sans">No meal data for this month yet</p>
        </div>
      ) : (
        <>
          <div>
            <p className="text-[10px] text-dimmed font-sans uppercase tracking-wide mb-1">Daily Calorie Balance</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'DM Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'DM Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickCount={5}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                <ReferenceLine
                  y={deficitZoneLine}
                  stroke="#4CAF82"
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                  label={{ value: 'Deficit zone', position: 'insideBottomRight', fontSize: 8, fill: '#4CAF82', opacity: 0.7 }}
                />
                <Bar dataKey="delta" radius={[2, 2, 0, 0]} maxBarSize={18}>
                  {dailyData.map((entry, i) => (
                    <Cell key={i} fill={getBarColor(entry.delta, targetCalories, entry.hasData)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cumulative progress bar */}
          <div>
            <p className="text-[10px] text-dimmed font-sans uppercase tracking-wide mb-1.5">Cumulative Progress</p>
            <div className="h-3 bg-border rounded-full overflow-hidden">
              <div
                style={{ width: `${pctConsumed}%`, backgroundColor: progressColor, height: '100%', borderRadius: 9999, transition: 'width 500ms ease' }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] font-mono text-dimmed">0</span>
              <span className="text-[10px] font-mono text-secondary font-semibold">{pctConsumed.toFixed(1)}% of target</span>
              <span className="text-[10px] font-mono text-dimmed">{Math.round(totalTargetKcal).toLocaleString()} kcal</span>
            </div>
            <p className={`text-xs font-sans mt-1.5 font-medium ${deltaKcal > 0 ? 'text-red-400' : 'text-success'}`}>
              You are {fmtKcal(deltaKcal)} kcal {deltaKcal > 0 ? 'over' : 'under'} target for the month
            </p>
            <p className="text-[11px] font-sans text-dimmed mt-0.5">
              Daily average: <span className="font-mono text-secondary">{dailyAvgConsumed.toLocaleString()}</span> kcal vs{' '}
              <span className="font-mono text-secondary">{Math.round(targetCalories).toLocaleString()}</span> kcal goal
            </p>
          </div>

          {/* Insight */}
          <p className="text-xs font-sans text-secondary bg-elevated rounded-xl px-3 py-2.5 border border-border/60">
            {getMonthlyInsight(deltaPct, planDaysElapsed)}
          </p>
        </>
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-elevated rounded-xl p-2.5 border border-border/60 text-center">
      <p className="text-[10px] font-sans text-dimmed uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`font-display font-bold text-base leading-tight ${color}`}>{value}</p>
      <p className="text-[10px] font-sans text-dimmed">{sub}</p>
    </div>
  );
}
