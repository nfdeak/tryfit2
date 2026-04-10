import { useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/appStore';

export function useTracker() {
  const {
    weekData, stats, weekStart,
    setWeekData, setStats, setWeekStart, toggleMealEaten, setMealsPerDay
  } = useAppStore();

  const loadWeekData = useCallback(async () => {
    try {
      const [weekRes, statsRes] = await Promise.all([
        axios.get('/api/tracker/week', { withCredentials: true }),
        axios.get('/api/tracker/stats', { withCredentials: true })
      ]);
      setWeekData(weekRes.data.week);
      setWeekStart(weekRes.data.weekStart);
      setStats(statsRes.data);
      if (statsRes.data.mealsPerDay) {
        setMealsPerDay(statsRes.data.mealsPerDay);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadWeekData();
  }, [loadWeekData]);

  const toggleMeal = useCallback(async (date: string, mealIndex: number, currentEaten: boolean) => {
    toggleMealEaten(date, mealIndex, !currentEaten);
    try {
      await axios.post(`/api/tracker/${date}/${mealIndex}/toggle`, {}, { withCredentials: true });
      const statsRes = await axios.get('/api/tracker/stats', { withCredentials: true });
      setStats(statsRes.data);
    } catch {
      toggleMealEaten(date, mealIndex, currentEaten);
    }
  }, [toggleMealEaten, setStats]);

  return { weekData, stats, weekStart, toggleMeal, loadWeekData };
}
