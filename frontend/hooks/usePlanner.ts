import { useState, useEffect, useCallback } from 'react';
import { WeekPlan, getWeekId, getWeekPlan, setDayMeal, DayKey } from '../lib/planner';
import { useAuth } from './useAuth';

export function usePlanner(weekId?: string) {
  const { user } = useAuth();
  const resolvedWeekId = weekId ?? getWeekId();
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getWeekPlan(user.uid, resolvedWeekId).then((p) => {
      setPlan(p);
      setLoading(false);
    });
  }, [user?.uid, resolvedWeekId]);

  const setMeal = useCallback(async (day: DayKey, recipeId: string | null) => {
    if (!user) return;
    await setDayMeal(user.uid, resolvedWeekId, day, recipeId);
    setPlan((prev) => prev ? { ...prev, [day]: recipeId } : null);
  }, [user?.uid, resolvedWeekId]);

  return { plan, loading, setMeal, weekId: resolvedWeekId };
}
