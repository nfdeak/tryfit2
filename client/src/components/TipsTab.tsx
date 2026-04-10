import { useAppStore } from '../store/appStore';

const TIPS = [
  {
    category: "Nutrition",
    icon: "🥗",
    color: "bg-success-fill border-success/20",
    labelColor: "text-success",
    tips: [
      { title: "Protein First", body: "Build every meal around protein. Aim for 30-40g per meal to preserve muscle while cutting fat. Chicken, fish, eggs, and paneer are your best allies." },
      { title: "Track Your Macros", body: "Track your protein, carbs, fat, and fibre daily. Staying within your calorie target and hitting protein goals is the foundation of any successful diet plan." },
      { title: "Eat Before 8PM", body: "Try to finish dinner by 8pm. Late eating raises cortisol and blunts overnight fat metabolism." }
    ]
  },
  {
    category: "Hydration",
    icon: "💧",
    color: "bg-violet-fill border-violet/20",
    labelColor: "text-violet",
    tips: [
      { title: "Water Is Key", body: "Drink at least 2.5-3.5L of water daily based on your body weight. Dehydration mimics hunger - drink a full glass before each meal to reduce appetite." },
      { title: "Electrolytes Matter", body: "On a calorie deficit, your kidneys excrete more sodium. Add a pinch of rock salt to water or use electrolyte powder to prevent fatigue and headaches." },
      { title: "Green Tea 2x/Day", body: "Green tea boosts metabolic rate by 4-5% and improves fat oxidation. Have a cup mid-morning and mid-afternoon." }
    ]
  },
  {
    category: "Exercise",
    icon: "💪",
    color: "bg-accent-fill border-accent/20",
    labelColor: "text-accent",
    tips: [
      { title: "Strength Train 3-4x/Week", body: "Resistance training is non-negotiable for fat loss. It builds muscle that burns calories at rest and prevents the metabolic slowdown from dieting." },
      { title: "10,000 Steps Daily", body: "Non-exercise activity (NEAT) accounts for 15-30% of your daily calorie burn. Walk to meetings, take stairs - these steps add up to 300-500 extra kcal." },
      { title: "Morning Walk Fasted", body: "A 20-30 minute brisk walk in a fasted state taps directly into fat stores. Do this 3x per week before breakfast for accelerated fat loss." }
    ]
  },
  {
    category: "Lifestyle",
    icon: "😴",
    color: "bg-violet-fill border-violet/20",
    labelColor: "text-violet",
    tips: [
      { title: "7-8 Hours Sleep", body: "Sleep deprivation raises ghrelin (hunger hormone) by 24% and reduces leptin (fullness hormone). Poor sleep will undermine your diet regardless of how strict you are." },
      { title: "Manage Stress", body: "Chronic stress raises cortisol which drives belly fat storage. Even 10 minutes of deep breathing or meditation daily makes a measurable difference." },
      { title: "Meal Prep Sunday", body: "Prep proteins on Sunday: boil eggs, marinate chicken, portion curd. This removes the friction that leads to bad food choices on busy weekdays." }
    ]
  },
  {
    category: "Tracking",
    icon: "📊",
    color: "bg-surface border-border",
    labelColor: "text-primary",
    tips: [
      { title: "Weigh Once a Week", body: "Weigh yourself every Monday morning after using the bathroom, before eating. Daily fluctuations (0.5-1.5kg) are water weight - focus on the weekly trend." },
      { title: "Take Progress Photos", body: "The scale doesn't capture body composition changes. Take a front, side, and back photo every 2 weeks in the same lighting. Visual progress is motivating." },
      { title: "Log Meals Immediately", body: "Mark meals as eaten right after finishing, not at end of day. Retrospective logging is less accurate and misses the habit-reinforcing effect of immediate tracking." }
    ]
  }
];

export function TipsTab() {
  const { profile } = useAppStore();

  const currentWeight = profile?.weightKg;
  const targetWeight = profile?.targetWeightKg;
  const targetCalories = profile?.targetCalories;
  const hasGoalData = currentWeight && targetWeight;

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
      <div>
        <h2 className="font-display font-bold text-primary text-2xl">Tips & Guidance</h2>
        <p className="text-secondary text-sm font-sans mt-1">
          {hasGoalData
            ? `Science-backed advice for your ${currentWeight}→${targetWeight}kg journey`
            : 'Science-backed advice for your health journey'}
        </p>
      </div>

      {TIPS.map((section) => (
        <div key={section.category}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{section.icon}</span>
            <h3 className={`font-sans font-bold text-sm uppercase tracking-wide ${section.labelColor}`}>
              {section.category}
            </h3>
          </div>
          <div className="space-y-3">
            {section.tips.map((tip) => (
              <div key={tip.title} className={`rounded-2xl border p-4 card-glow ${section.color}`}>
                <h4 className="font-sans font-semibold text-primary text-sm mb-1.5">{tip.title}</h4>
                <p className="text-sm text-secondary font-sans leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

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

      <div className="h-4" />
    </div>
  );
}
