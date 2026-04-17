import { useEffect, useState } from 'react';
import axios from 'axios';
import { MealPrepGuide as MealPrepGuideType } from '../types';
import { useAppStore } from '../store/appStore';

export function MealPrepGuide() {
  const { setActiveTab } = useAppStore();
  const [guide, setGuide] = useState<MealPrepGuideType | null | undefined>(undefined); // undefined=loading

  useEffect(() => {
    axios.get('/api/plan/meal-prep-guide', { withCredentials: true })
      .then(res => setGuide(res.data.guide ?? null))
      .catch(() => setGuide(null));
  }, []);

  if (guide === undefined) {
    return (
      <div className="space-y-3 px-1 py-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-elevated rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="px-1 py-3 text-center space-y-3">
        <p className="text-sm text-secondary font-sans">
          No prep guide yet. Regenerate your meal plan to unlock your personalised weekly prep guide.
        </p>
        <button
          onClick={() => setActiveTab('profile')}
          className="text-accent text-sm font-sans font-medium underline underline-offset-2"
        >
          Go to Profile → Regenerate Plan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1">
      <p className="text-sm text-secondary font-sans leading-relaxed">{guide.intro}</p>

      {guide.sections.map((section) => (
        <div key={section.category}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{section.emoji}</span>
            <span className="text-xs font-semibold font-sans text-primary uppercase tracking-wide">
              {section.category}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <ul className="space-y-2">
            {section.tasks.map((task, i) => (
              <li key={i} className="bg-elevated rounded-xl p-3 border border-border/60">
                <p className="text-sm text-primary font-sans leading-snug">{task.instruction}</p>
                {task.usedOn && (
                  <p className="text-xs text-accent font-sans mt-1">📅 {task.usedOn}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="bg-accent-fill border border-accent/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
        <span className="text-sm">⏱️</span>
        <p className="text-sm font-sans text-primary">
          Estimated total prep time: <span className="font-semibold">{guide.estimatedMinutes}–{guide.estimatedMinutes + 15} minutes</span>
        </p>
      </div>
    </div>
  );
}
