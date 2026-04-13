import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { calculateBMI } from '../utils/tdee';

const router = Router();

// Use Haiku for speed (3-5x faster than Sonnet for structured JSON)
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-3-5-20241022';

// Rate limit: 3 calls per user per day
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

function getMealTypes(mealsPerDay: number): string[] {
  if (mealsPerDay === 3) return ['Breakfast', 'Lunch', 'Dinner'];
  if (mealsPerDay === 5) return ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'];
  return ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
}

// Static system prompt — cacheable across requests
const SYSTEM_PROMPT = `You are a professional nutritionist and meal planner. You generate 7-day personalised meal plans as pure JSON.

RULES:
- Respect ALL allergies and avoidances strictly — health requirement
- Use preferred ingredients wherever possible
- Meals should be easy to cook (under 30 minutes)
- Vary meals — never repeat the same meal in a week
- Day totals must be within ±50 kcal of the daily calorie target
- Descriptions must be concise cooking instructions with exact gram/ml quantities (e.g. "Heat 1 tsp ghee, sauté 150g chicken with 100g onions, add spices, serve with 80g rice")
- Respond ONLY with valid JSON, no markdown, no preamble

JSON STRUCTURE:
{"weekSummary":{"avgCalories":0,"avgProtein":0,"avgCarbs":0,"avgFat":0,"avgFibre":0},"days":[{"dayIndex":0,"dayName":"Monday","totalCalories":0,"totalProtein":0,"totalCarbs":0,"totalFat":0,"totalFibre":0,"meals":[{"mealIndex":0,"type":"Breakfast","time":"8:00 AM","name":"meal name","description":"Heat 1 tsp ghee, sauté 150g diced chicken with 80g onions, add 100g cooked rice and 30g peas","cookingTip":"one tip","ingredients":["150g chicken breast","80g onion"],calories":0,"protein":0,"carbs":0,"fat":0,"fibre":0}]}],"shoppingList":[{"category":"Proteins","items":[{"name":"Chicken breast","quantity":"1","unit":"kg"}]}]}`;

function buildUserPrompt(profile: any): string {
  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const cuisines = JSON.parse(profile.cuisinePreferences);
  const allergies = JSON.parse(profile.allergies);
  const preferred = JSON.parse(profile.preferredIngredients);
  const avoid = JSON.parse(profile.avoidIngredients);
  const health = JSON.parse(profile.healthConditions);
  const equipment = JSON.parse(profile.kitchenEquipment);

  const mealPref = profile.mealPreference?.toLowerCase() || '';
  const nonVegItems = ['chicken', 'fish', 'tuna', 'prawns', 'mutton'];
  const nonVeganItems = [...nonVegItems, 'eggs', 'paneer', 'whey protein', 'curd/yogurt', 'milk', 'cheese', 'butter', 'ghee', 'buttermilk'];

  let filteredPreferred = preferred;
  if (mealPref === 'vegan') {
    filteredPreferred = preferred.filter((i: string) => !nonVeganItems.some(nv => i.toLowerCase().includes(nv)));
  } else if (mealPref === 'vegetarian') {
    filteredPreferred = preferred.filter((i: string) => !nonVegItems.some(nv => i.toLowerCase().includes(nv)));
  } else if (mealPref === 'eggetarian') {
    filteredPreferred = preferred.filter((i: string) => !nonVegItems.some(nv => i.toLowerCase().includes(nv)));
  } else if (mealPref === 'pescatarian') {
    const landMeat = ['chicken', 'mutton'];
    filteredPreferred = preferred.filter((i: string) => !landMeat.some(nv => i.toLowerCase().includes(nv)));
  }

  const mealTypes = getMealTypes(profile.mealsPerDay);

  const customInstructions = (profile.mealPlanCustomInstructions || '').trim();
  const customBlock = customInstructions ? `

USER CUSTOMISATION INSTRUCTIONS (highest priority — follow these exactly):
"${customInstructions}"

These are specific instructions from the user to modify their meal plan.
Apply these on top of their profile preferences. If an instruction
conflicts with a dietary restriction or allergy, ignore the instruction
and keep the restriction. Otherwise, honour these instructions precisely.` : '';

  return `Generate a 7-day meal plan for:
${profile.name}, ${profile.age}y ${profile.gender}, ${profile.city} ${profile.country}
${profile.weightKg}kg → ${profile.targetWeightKg}kg, ${profile.heightCm}cm, BMI ${bmi}
Goal: ${profile.primaryGoal}, Intensity: ${profile.dietIntensity}
Activity: ${profile.activityLevel}, Diet: ${profile.mealPreference}
Cuisines: ${cuisines.join(', ') || 'Any'}
${profile.mealsPerDay} meals/day: ${mealTypes.join(', ')}
Window: ${profile.eatingWindow}, Wake: ${profile.wakeUpTime || '07:00'}, Sleep: ${profile.sleepTime || '23:00'}
Allergies: ${allergies.length > 0 ? allergies.join(', ') : 'None'}
Preferred: ${filteredPreferred.length > 0 ? filteredPreferred.join(', ') : 'Any'}
Avoid: ${avoid.length > 0 ? avoid.join(', ') : 'None'}
Health: ${health.length > 0 ? health.join(', ') : 'None'}
Cooking: ${profile.cookingStyle || 'home'}, Equipment: ${equipment.length > 0 ? equipment.join(', ') : 'Stovetop'}
${profile.weeklyBudget ? `Budget: ${profile.budgetCurrency} ${profile.weeklyBudget}/week` : ''}
TARGETS: ${profile.targetCalories} kcal, ${profile.proteinTarget}g protein, ${profile.carbTarget}g carbs, ${profile.fatTarget}g fat, ${profile.fibreTarget}g fibre${customBlock}`;
}

// POST /api/ai/generate-meal-plan (SSE streaming)
router.post('/generate-meal-plan', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  if (!checkRateLimit(userId)) {
    res.status(429).json({ error: 'Rate limit exceeded. Maximum 3 meal plan generations per day.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env' });
    return;
  }

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) {
    res.status(400).json({ error: 'User profile not found. Complete onboarding first.' });
    return;
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const client = new Anthropic({ apiKey });
    const userPrompt = buildUserPrompt(profile);

    const hasCustomInstructions = !!(profile.mealPlanCustomInstructions || '').trim();
    if (hasCustomInstructions) {
      sendEvent('progress', { step: 'Applying your custom preferences...' });
    }
    sendEvent('progress', { step: 'Generating your personalised meal plan...' });

    let planData: any = null;
    let lastError = '';
    const startTime = Date.now();

    for (let attempt = 1; attempt <= 2; attempt++) {
      console.log(`AI generation attempt ${attempt}...`);

      const stream = client.messages.stream({
        model: CLAUDE_MODEL,
        max_tokens: 12000,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [
          { role: 'user', content: userPrompt },
          ...(attempt > 1 ? [{ role: 'user' as const, content: 'Keep it concise. Return ONLY valid JSON.' }] : [])
        ]
      });

      // Stream token count progress to client every ~300 chars
      // Frequent SSE events also keep the connection alive on Vercel
      let tokenCount = 0;
      stream.on('text', (text) => {
        tokenCount += text.length;
        if (tokenCount % 300 < text.length) {
          sendEvent('progress', { step: 'Writing meals...', tokens: tokenCount });
        }
      });

      const message = await stream.finalMessage();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`AI response in ${elapsed}s — stop_reason: ${message.stop_reason}, usage: ${JSON.stringify(message.usage)}`);

      if (message.stop_reason === 'max_tokens') {
        console.warn(`Attempt ${attempt}: Response truncated`);
        lastError = 'AI response was too long and got cut off.';
        continue;
      }

      const textBlock = message.content.find(b => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        lastError = 'AI returned no text response.';
        continue;
      }

      try {
        let raw = textBlock.text.trim();
        if (raw.startsWith('```')) {
          raw = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        }
        const jsonStart = raw.indexOf('{');
        const jsonEnd = raw.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          raw = raw.substring(jsonStart, jsonEnd + 1);
        }
        planData = JSON.parse(raw);
        break;
      } catch (parseErr) {
        console.error(`Attempt ${attempt}: JSON parse failed (${textBlock.text.length} chars)`);
        lastError = 'AI returned malformed data.';
        continue;
      }
    }

    if (!planData) {
      sendEvent('error', { error: `${lastError} Please try again.` });
      res.end();
      return;
    }

    if (!planData.days || !Array.isArray(planData.days) || planData.days.length !== 7) {
      sendEvent('error', { error: 'AI returned an incomplete meal plan. Please try again.' });
      res.end();
      return;
    }

    sendEvent('progress', { step: 'Saving your meal plan...' });

    // Calorie check (warning only)
    const avgCalories = planData.weekSummary?.avgCalories || 0;
    if (Math.abs(avgCalories - profile.targetCalories) > 100) {
      console.warn(`AI plan calories (${avgCalories}) differ from target (${profile.targetCalories}) by >100 kcal`);
    }

    // Deactivate old meal plans
    await prisma.mealPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });

    // Get Monday of current week
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 1 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    // Create meal plan
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        weekStartDate: monday,
        weekSummary: JSON.stringify(planData.weekSummary || {}),
        isActive: true
      }
    });

    // Create all days in parallel
    await Promise.all(planData.days.map((dayData: any) =>
      prisma.mealPlanDay.create({
        data: {
          mealPlanId: mealPlan.id,
          dayIndex: dayData.dayIndex,
          dayName: dayData.dayName,
          totalCalories: dayData.totalCalories || 0,
          totalProtein: dayData.totalProtein || 0,
          totalCarbs: dayData.totalCarbs || 0,
          totalFat: dayData.totalFat || 0,
          totalFibre: dayData.totalFibre || 0,
          meals: JSON.stringify(dayData.meals || [])
        }
      })
    ));

    // Create shopping list
    const shoppingList = await prisma.generatedShoppingList.create({
      data: {
        userId,
        mealPlanId: mealPlan.id,
        categories: JSON.stringify(planData.shoppingList || []),
        peopleCount: 1
      }
    });

    // Reset meal logs & shopping items in parallel
    const planDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      planDates.push(d.toISOString().split('T')[0]);
    }

    await Promise.all([
      prisma.mealLog.deleteMany({ where: { userId, date: { in: planDates } } }),
      prisma.shoppingItem.deleteMany({ where: { userId } }),
      prisma.user.update({ where: { id: userId }, data: { onboardingDone: true } })
    ]);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Meal plan saved in ${totalTime}s total`);

    sendEvent('done', {
      success: true,
      mealPlanId: mealPlan.id,
      shoppingListId: shoppingList.id,
      weekSummary: planData.weekSummary,
      daysCount: planData.days.length
    });
    res.end();
  } catch (err: any) {
    console.error('AI generation error:', err);
    const errorMsg = err.message?.includes('timeout') || err.message?.includes('ETIMEDOUT')
      ? 'AI generation timed out. Please try again.'
      : 'Failed to generate meal plan. Please try again.';
    sendEvent('error', { error: errorMsg });
    res.end();
  }
});

export default router;
