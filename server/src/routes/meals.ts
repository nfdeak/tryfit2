import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/meals/replace
router.post('/replace', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const {
      date, dayIndex, mealIndex,
      foodName, foodSource, foodExternalId,
      servingSize, servingQty, servingGrams,
      calories, proteinG, carbsG, fatG, fibreG,
      note, isAiEstimate,
    } = req.body;

    // Validate required fields
    if (!date || typeof mealIndex !== 'number' || !foodName || !foodSource) {
      res.status(400).json({ error: 'Missing required fields: date, mealIndex, foodName, foodSource' });
      return;
    }

    if (mealIndex < 0 || mealIndex > 5) {
      res.status(400).json({ error: 'Invalid mealIndex' });
      return;
    }

    // Upsert the replacement
    const replacement = await prisma.mealReplacement.upsert({
      where: {
        userId_date_mealIndex: { userId, date, mealIndex },
      },
      update: {
        dayIndex: dayIndex ?? 0,
        foodName,
        foodSource,
        foodExternalId: foodExternalId || null,
        servingSize: servingSize || '1 serving',
        servingQty: servingQty ?? 1,
        servingGrams: servingGrams ?? null,
        calories: calories ?? 0,
        proteinG: proteinG ?? 0,
        carbsG: carbsG ?? 0,
        fatG: fatG ?? 0,
        fibreG: fibreG ?? 0,
        note: note || '',
        isAiEstimate: isAiEstimate ?? false,
      },
      create: {
        userId,
        date,
        dayIndex: dayIndex ?? 0,
        mealIndex,
        foodName,
        foodSource,
        foodExternalId: foodExternalId || null,
        servingSize: servingSize || '1 serving',
        servingQty: servingQty ?? 1,
        servingGrams: servingGrams ?? null,
        calories: calories ?? 0,
        proteinG: proteinG ?? 0,
        carbsG: carbsG ?? 0,
        fatG: fatG ?? 0,
        fibreG: fibreG ?? 0,
        note: note || '',
        isAiEstimate: isAiEstimate ?? false,
      },
    });

    // Also mark the meal as eaten
    try {
      const planDates = getPlanDates();
      const dIdx = planDates.indexOf(date);
      await prisma.mealLog.upsert({
        where: { userId_date_mealIndex: { userId, date, mealIndex } },
        update: { eaten: true, loggedAt: new Date() },
        create: { userId, date, dayIndex: dIdx >= 0 ? dIdx : (dayIndex ?? 0), mealIndex, eaten: true },
      });
    } catch {
      // non-critical
    }

    // Upsert RecentFoodLog — keep latest 10 per user
    try {
      await prisma.recentFoodLog.create({
        data: {
          userId,
          foodName,
          foodSource,
          foodData: {
            foodExternalId,
            servingSize,
            servingGrams,
            calories, proteinG, carbsG, fatG, fibreG,
            isAiEstimate,
          },
          usedAt: new Date(),
        },
      });

      // Clean old entries beyond 10
      const allRecent = await prisma.recentFoodLog.findMany({
        where: { userId },
        orderBy: { usedAt: 'desc' },
        select: { id: true },
      });
      if (allRecent.length > 10) {
        const toDelete = allRecent.slice(10).map(r => r.id);
        await prisma.recentFoodLog.deleteMany({
          where: { id: { in: toDelete } },
        });
      }
    } catch {
      // non-critical
    }

    res.json({ replacement });
  } catch (err: any) {
    console.error('Meal replace error:', err?.message || err);
    res.status(500).json({ error: 'Failed to save meal replacement' });
  }
});

// GET /api/meals/replacements?date=YYYY-MM-DD
router.get('/replacements', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const date = req.query.date as string;

    if (!date) {
      res.status(400).json({ error: 'date query parameter is required' });
      return;
    }

    const replacements = await prisma.mealReplacement.findMany({
      where: { userId, date },
    });

    res.json({ replacements });
  } catch (err: any) {
    console.error('Get replacements error:', err?.message || err);
    res.status(500).json({ error: 'Failed to load replacements' });
  }
});

// GET /api/meals/replacements/week — get all replacements for current week
router.get('/replacements/week', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const dates = getPlanDates();

    const replacements = await prisma.mealReplacement.findMany({
      where: { userId, date: { in: dates } },
    });

    res.json({ replacements });
  } catch (err: any) {
    console.error('Get week replacements error:', err?.message || err);
    res.status(500).json({ error: 'Failed to load week replacements' });
  }
});

// DELETE /api/meals/replace/:id
router.delete('/replace/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.mealReplacement.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ error: 'Replacement not found' });
      return;
    }

    await prisma.mealReplacement.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete replacement error:', err?.message || err);
    res.status(500).json({ error: 'Failed to delete replacement' });
  }
});

// Helper: get plan dates for current week
function getPlanDates(): string[] {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default router;
