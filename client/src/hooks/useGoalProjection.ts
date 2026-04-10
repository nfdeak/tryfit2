import { useMemo } from 'react';
import { useWeightStore } from '../store/weightStore';

export function useGoalProjection() {
  const { projection, goalDate, weeklyLossKg, startWeight } = useWeightStore();

  return useMemo(() => {
    if (!goalDate || projection.length === 0) {
      return { weeksLeft: 0, monthsLeft: 0, goalDate: null, targetWeight: 0, weeklyLossKg };
    }

    const target = projection[projection.length - 1].weightKg;
    const goalD = new Date(goalDate);
    const now = new Date();
    const diffMs = goalD.getTime() - now.getTime();
    const weeksLeft = Math.max(0, Math.round(diffMs / (7 * 24 * 60 * 60 * 1000)));
    const monthsLeft = Math.max(0, Math.round(diffMs / (30.44 * 24 * 60 * 60 * 1000)));

    return {
      weeksLeft,
      monthsLeft,
      goalDate,
      targetWeight: target,
      weeklyLossKg,
      startWeight
    };
  }, [projection, goalDate, weeklyLossKg, startWeight]);
}
