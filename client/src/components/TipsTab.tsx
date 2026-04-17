import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { MealPrepGuide } from './MealPrepGuide';

const TIPS_DATA = [
  {
    id: 'meal-timing',
    label: '⏰ Meal Timing',
    tips: [
      { title: 'Biggest meal at lunch', body: 'Have your largest meal at lunch when metabolism peaks. Finish dinner by 8 PM for a natural 10-hour overnight fast, improving fat metabolism while you sleep.' },
      { title: 'Eat Before 8PM', body: 'Late eating raises cortisol and blunts overnight fat metabolism. Move your last meal earlier even by 30 minutes to improve your results.' },
      { title: 'Pre-workout fuel', body: 'Eat a small protein + carb meal 1–1.5 hours before training. Rice + egg or banana + peanut butter are ideal for energy without heaviness.' },
    ]
  },
  {
    id: 'hydration',
    label: '💧 Hydration',
    tips: [
      { title: 'Water Is Key', body: 'Drink at least 2.5–3.5L of water daily based on body weight. Dehydration mimics hunger — drink a full glass before each meal to reduce appetite.' },
      { title: 'Electrolytes Matter', body: 'On a calorie deficit, kidneys excrete more sodium. Add a pinch of rock salt to water or use electrolyte powder to prevent fatigue and headaches.' },
      { title: 'Green Tea 2x/Day', body: 'Green tea boosts metabolic rate by 4–5% and improves fat oxidation. Have a cup mid-morning and mid-afternoon. Avoid after 5 PM to protect sleep.' },
    ]
  },
  {
    id: 'avoid',
    label: '🚫 What to Avoid',
    tips: [
      { title: 'Liquid calories', body: 'Juices, sodas, and sweetened coffees add 200–400 kcal without filling you up. Swap for water, black coffee, or unsweetened green tea.' },
      { title: 'Ultra-processed snacks', body: 'Chips, biscuits, and packaged snacks are engineered to override satiety signals. Keep them out of the house — you cannot moderate what is in arm\'s reach.' },
      { title: 'Skipping meals', body: 'Skipping makes you hungrier for the next meal and lowers metabolism. Eat consistently. If time-pressed, have a protein shake rather than nothing.' },
    ]
  },
  {
    id: 'substitutions',
    label: '✅ Smart Substitutions',
    tips: [
      { title: 'Cauliflower rice', body: 'Replace white rice with cauliflower rice to save 150–200 kcal per serving with no drop in volume. Grate raw cauliflower and microwave 3 min.' },
      { title: 'Greek yogurt for cream', body: 'Greek yogurt gives the same creamy texture as heavy cream with 5x the protein and 60% fewer calories. Works in curries, smoothies, and dressings.' },
      { title: 'Eggs over protein powder', body: 'Whole eggs are the most bioavailable protein source at a fraction of the cost of supplements. 3 eggs = 18g protein, healthy fats, vitamins.' },
    ]
  },
  {
    id: 'portions',
    label: '📏 Portion Control',
    tips: [
      { title: 'Plate method', body: 'Half the plate vegetables, quarter protein, quarter complex carbs. This ratio naturally hits macro targets without weighing food at every meal.' },
      { title: 'Use smaller plates', body: 'A 10-inch plate feels full with 30% less food than a 12-inch plate. Visual cues strongly influence how full you feel. Small change, big impact.' },
      { title: 'Slow down', body: 'Satiety signals take 15–20 minutes to reach your brain. Put the fork down between bites and aim for 20+ minutes per meal. You will naturally eat less.' },
    ]
  },
  {
    id: 'exercise',
    label: '🏃 Exercise & Recovery',
    tips: [
      { title: 'Strength Train 3–4x/Week', body: 'Resistance training builds muscle that burns calories at rest and prevents metabolic slowdown from dieting. Prioritise compound lifts: squat, press, pull.' },
      { title: '10,000 Steps Daily', body: 'Non-exercise activity (NEAT) accounts for 15–30% of daily calorie burn. Walk to meetings, take stairs — these steps add up to 300–500 extra kcal/day.' },
      { title: 'Morning Walk Fasted', body: 'A 20–30 minute brisk walk before breakfast taps directly into fat stores. Do this 3x per week for accelerated fat loss with no gym required.' },
    ]
  },
  {
    id: 'sleep',
    label: '😴 Sleep & Recovery',
    tips: [
      { title: '7–8 Hours Sleep', body: 'Sleep deprivation raises ghrelin (hunger hormone) by 24% and reduces leptin (fullness). Poor sleep will undermine your diet regardless of how strict you are.' },
      { title: 'Manage Stress', body: 'Chronic stress raises cortisol which drives belly fat storage. Even 10 minutes of deep breathing or meditation daily makes a measurable difference.' },
      { title: 'Consistent sleep schedule', body: 'Go to bed and wake at the same times even on weekends. Irregular sleep disrupts cortisol and insulin rhythm, making fat loss harder.' },
    ]
  },
  {
    id: 'tracking',
    label: '📊 Tracking & Progress',
    tips: [
      { title: 'Weigh Once a Week', body: 'Weigh every Monday morning after using the bathroom, before eating. Daily fluctuations (0.5–1.5kg) are water weight — focus on the weekly trend.' },
      { title: 'Take Progress Photos', body: 'The scale does not capture body composition changes. Take front, side, and back photos every 2 weeks in the same lighting. Visual progress is motivating.' },
      { title: 'Log Meals Immediately', body: 'Mark meals as eaten right after finishing, not at end of day. Immediate logging reinforces the habit and is more accurate than memory.' },
    ]
  },
];

const LS_KEY = 'tipsExpandedSections';

function getInitialExpanded(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  // Default: all collapsed, prep guide expanded
  return { 'prep-guide': true };
}

// ── Collapsible Section ────────────────────────────────────────────────────
function CollapsibleSection({
  id, label, expanded, onToggle, children
}: {
  id: string; label: string; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden card-glow">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-elevated/50 transition-colors"
      >
        <span className="font-sans font-semibold text-primary text-sm">{label}</span>
        <span className={`text-secondary text-xs transition-transform duration-250 ${expanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </button>

      <div
        ref={contentRef}
        style={{
          maxHeight: expanded ? '2000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 250ms ease-in-out',
        }}
      >
        <div className="px-4 pb-4 pt-1 border-t border-border/60">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── TipsTab ────────────────────────────────────────────────────────────────
export function TipsTab() {
  const { profile } = useAppStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(getInitialExpanded);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const currentWeight = profile?.weightKg;
  const targetWeight = profile?.targetWeightKg;
  const targetCalories = profile?.targetCalories;
  const hasGoalData = currentWeight && targetWeight;

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
      <div>
        <h2 className="font-display font-bold text-primary text-2xl">Tips & Guidance</h2>
        <p className="text-secondary text-sm font-sans mt-1">
          {hasGoalData
            ? `Science-backed advice for your ${currentWeight}→${targetWeight}kg journey`
            : 'Science-backed advice for your health journey'}
        </p>
      </div>

      {/* Goal card */}
      {hasGoalData && (
        <div className="bg-surface rounded-2xl p-4 text-center border border-border card-glow">
          <p className="text-dimmed text-xs font-sans uppercase tracking-wide mb-2">Your Goal</p>
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-primary font-display font-bold text-3xl">{currentWeight}<span className="text-lg text-secondary">kg</span></p>
              <p className="text-dimmed text-xs font-sans">Current</p>
            </div>
            <div className="text-accent text-2xl">→</div>
            <div>
              <p className="text-accent font-display font-bold text-3xl">{targetWeight}<span className="text-lg text-accent/70">kg</span></p>
              <p className="text-dimmed text-xs font-sans">Target</p>
            </div>
          </div>
          {targetCalories && (
            <p className="text-dimmed text-xs font-sans mt-3">
              {Math.abs(currentWeight - targetWeight)} kg to {currentWeight > targetWeight ? 'lose' : 'gain'} · ~<span className="font-mono">{Math.round(targetCalories)}</span> kcal/day
            </p>
          )}
        </div>
      )}

      {/* Collapsible tip sections */}
      {TIPS_DATA.map(section => (
        <CollapsibleSection
          key={section.id}
          id={section.id}
          label={section.label}
          expanded={!!expanded[section.id]}
          onToggle={() => toggle(section.id)}
        >
          <div className="space-y-3 pt-2">
            {section.tips.map(tip => (
              <div key={tip.title} className="bg-elevated rounded-xl p-3.5 border border-border/60">
                <h4 className="font-sans font-semibold text-primary text-sm mb-1">{tip.title}</h4>
                <p className="text-sm text-secondary font-sans leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      ))}

      {/* Weekly Meal Prep Guide — expanded by default */}
      <CollapsibleSection
        id="prep-guide"
        label="📋 Weekly Meal Prep Guide"
        expanded={!!expanded['prep-guide']}
        onToggle={() => toggle('prep-guide')}
      >
        <div className="pt-2">
          <MealPrepGuide />
        </div>
      </CollapsibleSection>

      <div className="h-4" />
    </div>
  );
}
