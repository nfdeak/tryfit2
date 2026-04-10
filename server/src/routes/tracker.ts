import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function getMondayOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getPlanDates(): string[] {
  const monday = getMondayOfCurrentWeek();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

async function getMealsPerDay(userId: string): Promise<number> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  return profile?.mealsPerDay || 4;
}

// GET /api/tracker/stats
router.get('/stats', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const planDates = getPlanDates();
  const mealsPerDay = await getMealsPerDay(userId);
  const totalMeals = 7 * mealsPerDay;

  const logs = await prisma.mealLog.findMany({
    where: { userId, date: { in: planDates }, eaten: true }
  });

  const eaten = logs.length;
  const adherence = totalMeals > 0 ? Math.round((eaten / totalMeals) * 100) : 0;
  const remaining = totalMeals - eaten;

  // Streak: consecutive days from Day 0 with all meals eaten
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const date = planDates[i];
    const dayLogs = logs.filter(l => l.date === date);
    if (dayLogs.length === mealsPerDay) {
      streak = i + 1;
    } else {
      break;
    }
  }

  res.json({ eaten, total: totalMeals, adherence, streak, remaining, mealsPerDay });
});

// GET /api/tracker/week
router.get('/week', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const planDates = getPlanDates();
  const mealsPerDay = await getMealsPerDay(userId);

  const logs = await prisma.mealLog.findMany({
    where: { userId, date: { in: planDates } }
  });

  const week = planDates.map((date, dayIndex) => {
    const dayLogs = logs.filter(l => l.date === date);
    const meals = Array.from({ length: mealsPerDay }, (_, mealIndex) => {
      const log = dayLogs.find(l => l.mealIndex === mealIndex);
      return { mealIndex, eaten: log?.eaten ?? false };
    });
    return { date, dayIndex, meals };
  });

  res.json({ week, weekStart: planDates[0], mealsPerDay });
});

// GET /api/tracker/:date
router.get('/:date', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { date } = req.params;
  const mealsPerDay = await getMealsPerDay(userId);

  const logs = await prisma.mealLog.findMany({
    where: { userId, date }
  });

  const meals = Array.from({ length: mealsPerDay }, (_, mealIndex) => {
    const log = logs.find(l => l.mealIndex === mealIndex);
    return { mealIndex, eaten: log?.eaten ?? false };
  });

  const planDates = getPlanDates();
  const dayIndex = planDates.indexOf(date);

  res.json({ date, dayIndex, meals });
});

// POST /api/tracker/:date/:mealIndex/toggle
router.post('/:date/:mealIndex/toggle', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { date, mealIndex } = req.params;
  const mealIdx = parseInt(mealIndex, 10);

  if (isNaN(mealIdx) || mealIdx < 0 || mealIdx > 5) {
    res.status(400).json({ error: 'Invalid meal index' });
    return;
  }

  const planDates = getPlanDates();
  const dayIndex = planDates.indexOf(date);

  const existing = await prisma.mealLog.findUnique({
    where: { userId_date_mealIndex: { userId, date, mealIndex: mealIdx } }
  });

  let log;
  if (existing) {
    log = await prisma.mealLog.update({
      where: { id: existing.id },
      data: { eaten: !existing.eaten, loggedAt: new Date() }
    });
  } else {
    log = await prisma.mealLog.create({
      data: { userId, date, dayIndex, mealIndex: mealIdx, eaten: true }
    });
  }

  res.json({ mealIndex: mealIdx, eaten: log.eaten, date });
});

export default router;
