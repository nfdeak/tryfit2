import { useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/appStore';

export function usePlan() {
  const { planDays, isGenerated, setPlanDays, setMealsPerDay } = useAppStore();

  const loadPlan = useCallback(async () => {
    try {
      const res = await axios.get('/api/plan', { withCredentials: true });
      const days = res.data.days || [];
      setPlanDays(days, res.data.isGenerated || false);
      if (days.length > 0 && days[0].meals) {
        setMealsPerDay(days[0].meals.length);
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
