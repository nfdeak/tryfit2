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

function getPlanDates(planDuration = 7): string[] {
  const monday = getMondayOfCurrentWeek();
  const dates: string[] = [];
  for (let i = 0; i < planDuration; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function getWeekDates(weekStartDate: string): string[] {
  const start = new Date(weekStartDate + 'T00:00:00Z');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function getMonthDates(month: string): string[] {
  // month = "YYYY-MM"
  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, mon - 1, i + 1);
    return d.toISOString().split('T')[0];
  });
}

function weeklyLossRate(intensity: string): number {
  if (intensity === 'low') return 0.3;
  if (intensity === 'high') return 0.75;
  return 0.5; // moderate
}

async function getMealsPerDay(userId: string): Promise<number> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  return profile?.mealsPerDay || 4;
}

// GET /api/tracker/summary?period=week&weekStart=YYYY-MM-DD
// GET /api/tracker/summary?period=month&month=YYYY-MM
router.get('/summary', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const period = req.query.period as string;
    const mealsPerDay = await getMealsPerDay(userId);

    if (period === 'week') {
      const weekStart = req.query.weekStart as string;
      if (!weekStart) { res.status(400).json({ error: 'weekStart required' }); return; }
      const dates = getWeekDates(weekStart);
      const logs = await prisma.mealLog.findMany({
        where: { userId, date: { in: dates }, eaten: true }
      });
      const total = 7 * mealsPerDay;
      const eaten = logs.length;
      res.json({ eaten, total, adherencePct: total > 0 ? Math.round((eaten / total) * 100) : 0 });
      return;
    }

    if (period === 'month') {
      const month = req.query.month as string; // "YYYY-MM"
      if (!month) { res.status(400).json({ error: 'month required' }); return; }
      const dates = getMonthDates(month);
      // Get plan dates to know which days are plan days
      const planDates = getPlanDates();
      const planDatesInMonth = dates.filter(d => planDates.includes(d));
      const total = planDatesInMonth.length * mealsPerDay;
      const logs = await prisma.mealLog.findMany({
        where: { userId, date: { in: planDatesInMonth }, eaten: true }
      });
      const eaten = logs.length;
      res.json({ eaten, total, adherencePct: total > 0 ? Math.round((eaten / total) * 100) : 0 });
      return;
    }

    res.status(400).json({ error: 'period must be week or month' });
  } catch (err) {
    console.error('Tracker summary error:', err instanceof Error ? err.message : 'unknown');
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/tracker/goal-countdown
router.get('/goal-countdown', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Use latest weight log if available, otherwise profile's current weight
    const latestLog = await prisma.weightLog.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' }
    });
    const currentWeight = latestLog?.weightKg ?? profile.weightKg;
    const targetWeight = profile.targetWeightKg;
    const weightToLose = currentWeight - targetWeight;

    if (weightToLose <= 0) {
      res.json({
        goalDate: new Date().toISOString().split('T')[0],
        daysLeft: 0,
        weeksLeft: 0,
        displayText: "You've reached your goal weight! 🎉",
        isUrgent: false
      });
      return;
    }

    const rate = weeklyLossRate(profile.dietIntensity);
    const weeksNeeded = Math.ceil(weightToLose / rate);
    const goalDate = new Date();
    goalDate.setDate(goalDate.getDate() + weeksNeeded * 7);
    const goalDateStr = goalDate.toISOString().split('T')[0];
    const daysLeft = weeksNeeded * 7;

    let displayText: string;
    const isUrgent = daysLeft < 7;
    if (daysLeft <= 0) displayText = "You've reached your goal date!";
    else if (daysLeft < 7) displayText = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
    else if (daysLeft < 14) displayText = `${Math.ceil(daysLeft / 7)} week left`;
    else displayText = `${Math.ceil(daysLeft / 7)} weeks left`;

    res.json({ goalDate: goalDateStr, daysLeft, weeksLeft: weeksNeeded, displayText, isUrgent, targetWeight, currentWeight });
  } catch (err) {
    console.error('Goal countdown error:', err instanceof Error ? err.message : 'unknown');
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/tracker/stats
router.get('/stats', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const profile = await prisma.userProfile.findUnique({ where: { userId }, select: { planDuration: true } });
    const planDuration = profile?.planDuration || 7;
    const planDates = getPlanDates(planDuration);
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
  } catch (err) {
    console.error('Tracker stats error:', err instanceof Error ? err.message : 'unknown');
    res.status(500).json({ error: 'server_error', message: 'Failed to load tracker stats.' });
  }
});

// GET /api/tracker/week
router.get('/week', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const profile = await prisma.userProfile.findUnique({ where: { userId }, select: { planDuration: true } });
    const planDuration = profile?.planDuration || 7;
    const planDates = getPlanDates(planDuration);
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

    res.json({ week, weekStart: planDates[0], mealsPerDay, planDuration });
  } catch (err) {
    console.error('Tracker week error:', err instanceof Error ? err.message : 'unknown');
    res.status(500).json({ error: 'server_error', message: 'Failed to load tracker week.' });
  }
});

// GET /api/tracker/:date
router.get('/:date', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
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
  } catch (err) {
    console.error('Tracker date error:', err instanceof Error ? err.message : 'unknown');
    res.status(500).json({ error: 'server_error', message: 'Failed to load tracker data.' });
  }
});

// POST /api/tracker/:date/:mealIndex/toggle
router.post('/:date/:mealIndex/toggle', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
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
  } catch (err) {
    console.error('Tracker toggle error:', err instanceof Error ? err.message : 'unknown');
    res.status(500).json({ error: 'server_error', message: 'Failed to toggle meal.' });
  }
});

export default router;
