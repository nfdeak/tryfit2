import { useMemo } from 'react';
import { ChartPoint, TimeRange, WeightLog, WeightProjectionPoint } from '../types';

export function useWeightChart(
  logs: WeightLog[],
  projection: WeightProjectionPoint[],
  timeRange: TimeRange
) {
  const chartData = useMemo(() => {
    // Build a map of all dates
    const dateMap = new Map<string, ChartPoint>();

    // Add projection points (skip invalid entries)
    for (const p of projection) {
      if (!p || typeof p.date !== 'string' || typeof p.weightKg !== 'number') continue;
      const key = p.date;
      dateMap.set(key, { date: key, projected: p.weightKg });
    }

    // Add actual weight logs (skip invalid entries)
    for (const log of logs) {
      if (!log || typeof log.loggedAt !== 'string' || typeof log.weightKg !== 'number') continue;
      const key = log.loggedAt.substring(0, 10); // YYYY-MM-DD
      const existing = dateMap.get(key) || { date: key };
      existing.actual = log.weightKg;
      dateMap.set(key, existing);
    }

    // Sort by date
    let points = Array.from(dateMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    // Apply time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      const months = timeRange === '1M' ? 1 : timeRange === '3M' ? 3 : 6;
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - months);
      const cutoffStr = cutoff.toISOString().substring(0, 10);
      points = points.filter(p => p.date >= cutoffStr);
    }

    // Mark today and goal
    const todayStr = new Date().toISOString().substring(0, 10);
    for (const p of points) {
      if (p.date === todayStr) p.isToday = true;
    }
    if (points.length > 0 && projection.length > 0) {
      const goalDate = projection[projection.length - 1].date;
      const goalPoint = points.find(p => p.date === goalDate);
      if (goalPoint) goalPoint.isGoal = true;
    }

    return points;
  }, [logs, projection, timeRange]);

  const domain = useMemo(() => {
    const allWeights = chartData
      .flatMap(p => [p.actual, p.projected])
      .filter((v): v is number => v !== undefined);
    if (allWeights.length === 0) return [0, 100] as [number, number];
    const min = Math.floor(Math.min(...allWeights) - 2);
    const max = Math.ceil(Math.max(...allWeights) + 2);
    return [min, max] as [number, number];
  }, [chartData]);

  return { chartData, domain };
}
