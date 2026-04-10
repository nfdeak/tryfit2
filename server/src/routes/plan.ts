import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { MEAL_PLAN } from '../data/mealPlan';

const router = Router();

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

// GET /api/plan — returns meal plan data (AI-generated or fallback to hardcoded)
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  // Try to find active AI-generated plan
  const activePlan = await prisma.mealPlan.findFirst({
    where: { userId, isActive: true },
    include: { days: { orderBy: { dayIndex: 'asc' } } }
  });

  if (activePlan && activePlan.days.length > 0) {
    const days = activePlan.days.map(d => ({
      label: d.dayName,
      dayIndex: d.dayIndex,
      totalCalories: d.totalCalories,
      totalProtein: d.totalProtein,
      totalCarbs: d.totalCarbs,
      totalFat: d.totalFat,
      totalFibre: d.totalFibre,
      meals: JSON.parse(d.meals)
    }));

    res.json({
      days,
      isGenerated: true,
      weekSummary: JSON.parse(activePlan.weekSummary),
      mealPlanId: activePlan.id
    });
    return;
  }

  // Fallback to hardcoded data
  res.json({ days: MEAL_PLAN, isGenerated: false });
});

// GET /api/plan/week-start
router.get('/week-start', requireAuth, (_req: AuthRequest, res: Response): void => {
  const weekStart = getMondayOfCurrentWeek();
  res.json({ weekStart });
});

export default router;
