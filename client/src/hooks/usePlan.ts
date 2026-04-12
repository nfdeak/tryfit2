import { useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/appStore';

export function usePlan() {
  const { planDays, isGenerated, setPlanDays, setMealsPerDay } = useAppStore();

  const loadPlan = useCallback(async () => {
    try {
      const res = await axios.get('/api/plan', { withCredentials: true });
      const days = res.data.days;
      // Validate that days is actually an array of day plan objects
      if (Array.isArray(days) && days.every((d: any) => d && typeof d.label === 'string' && Array.isArray(d.meals))) {
        setPlanDays(days, res.data.isGenerated || false);
        if (days.length > 0 && days[0].meals) {
          setMealsPerDay(days[0].meals.length);
        }
      } else {
        setPlanDays([], false);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  return { planDays, isGenerated, loadPlan };
}
