import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { apiUrl } from '../lib/api';
import { useAppStore } from '../store/appStore';
import { useWeightStore } from '../store/weightStore';
import { UserProfile } from '../types';
import { MealPlanCustomiser } from './MealPlanCustomiser';
import { WeightStatsHeader } from './weight/WeightStatsHeader';
import { GoalProjectionCard } from './weight/GoalProjectionCard';
import { WeightProgressChart } from './weight/WeightProgressChart';
import { WeightLogModal } from './weight/WeightLogModal';
import { WeightLogList } from './weight/WeightLogList';
import { ErrorBoundary } from './ErrorBoundary';

export function ProfileTab() {
  const { user, logout, refreshUser } = useAuth();
  const { profile, setProfile, setActiveTab } = useAppStore();
  const [regenerating, setRegenerating] = useState(false);
  const [regenStep, setRegenStep] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [error, setError] = useState('');
  const [mealInstructions, setMealInstructions] = useState('');
  const instructionsRef = useRef('');
  const { fetchLogs, fetchProjection } = useWeightStore();

  useEffect(() => {
    axios.get('/api/profile', { withCredentials: true })
      .then(res => {
        if (res.data.profile) {
          setProfile(res.data.profile);
          const saved = res.data.profile.mealPlanCustomInstructions || '';
          setMealInstructions(saved);
          instructionsRef.current = saved;
        }
      })
      .catch(() => {});
    // Fetch weight data
    fetchLogs();
    fetchProjection();
  }, []);

  const handleInstructionsChange = (text: string) => {
    setMealInstructions(text);
    instructionsRef.current = text;
  };

  const handleRegenerateClick = () => {
    setShowConfirm(true);
  };

  const handleRegenerate = async () => {
    setShowConfirm(false);
    setRegenerating(true);
    setError('');
    try {
      setRegenStep('Generating your new meal plan...');

      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl('/api/ai/generate-meal-plan'));
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.withCredentials = true;
        xhr.timeout = 180000;

        let processed = 0;
        let settled = false;
        const parseSSE = () => {
          const text = xhr.responseText.substring(processed);
          processed = xhr.responseText.length;
          const blocks = text.split('\n\n');
          for (const block of blocks) {
            const eventMatch = block.match(/^event: (\w+)/);
            const dataMatch = block.match(/^data: (.+)$/m);
            if (!eventMatch || !dataMatch) continue;
            try {
              const parsed = JSON.parse(dataMatch[1]);
              if (eventMatch[1] === 'progress') setRegenStep(parsed.step);
              else if (eventMatch[1] === 'done' && !settled) { settled = true; resolve(parsed); }
              else if (eventMatch[1] === 'error' && !settled) { settled = true; reject(new Error(parsed.error)); }
            } catch {}
          }
        };
        xhr.onprogress = parseSSE;
        xhr.onload = () => {
          parseSSE();
          if (!settled) {
            if (xhr.status >= 400) {
              try { reject(new Error(JSON.parse(xhr.responseText).error || 'Failed')); }
              catch { reject(new Error('Failed to regenerate')); }
            } else { reject(new Error('No response received')); }
          }
        };
        xhr.onerror = () => { if (!settled) reject(new Error('Network error')); };
        xhr.ontimeout = () => { if (!settled) reject(new Error('Request timed out')); };
        xhr.send('{}');
      });

      if (!result?.success) throw new Error('Failed');
      setRegenStep('Done!');
      await refreshUser();
      setRegenerating(false);
      setShowSuccess(true);
      if (instructionsRef.current.trim()) {
        setShowBanner(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to regenerate');
      setRegenerating(false);
    }
  };

  if (regenerating) {
    return (
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🍽️</div>
          <h3 className="font-display text-xl font-bold text-primary mb-2">Regenerating Plan</h3>
          <p className="text-accent font-sans text-sm">{regenStep}</p>
          <div className="w-48 h-1.5 bg-border rounded-full overflow-hidden mx-auto mt-4">
            <div className="h-full shimmer rounded-full" style={{ width: '60%' }} />
          </div>
          {error && (
            <div className="mt-4 bg-red-900/30 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl font-sans">
              {error}
              <button onClick={() => setRegenerating(false)} className="block mt-2 text-accent underline">Back</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 bg-success-fill rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">✅</span>
          </div>
          <h3 className="font-display text-2xl font-bold text-primary mb-2">Plan Ready!</h3>
          <p className="text-secondary font-sans text-sm leading-relaxed mb-6">
            Your personalised 7-day meal plan has been generated successfully. Head over to the Meals tab to view your new diet plan.
          </p>
          <button
            onClick={() => {
              setShowSuccess(false);
              setActiveTab('meals');
            }}
            className="w-full bg-accent text-white font-semibold py-3.5 rounded-[14px] font-sans text-base active:scale-95 transition-all"
          >
            View My Meal Plan
          </button>
          <button
            onClick={() => setShowSuccess(false)}
            className="w-full mt-3 bg-surface border border-border text-secondary font-medium py-3 rounded-[14px] font-sans text-sm hover:bg-elevated transition-colors"
          >
            Stay on Profile
          </button>
        </div>
      </div>
    );
  }

  const initials = (user?.name || user?.username || 'U').substring(0, 2).toUpperCase();
  const hasInstructions = mealInstructions.trim().length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {/* Success banner */}
      {showBanner && (
        <div className="bg-success-fill border border-success/30 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-sans text-success font-medium">
            Your meal plan has been updated with your custom changes
          </p>
          <button onClick={() => setShowBanner(false)} className="text-success/60 hover:text-success ml-2 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* User card */}
      <div className="bg-surface rounded-2xl p-5 flex items-center gap-4 border border-border card-glow">
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-14 h-14 rounded-full" />
        ) : (
          <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center text-accent font-display font-bold text-lg">{initials}</div>
        )}
        <div>
          <h2 className="font-display font-bold text-primary text-lg">{user?.name || user?.username}</h2>
          <p className="text-secondary text-sm font-sans">{user?.email || `@${user?.username}`}</p>
        </div>
      </div>

      {/* Stats */}
      {profile && (
        <>
          <div className="bg-surface rounded-2xl border border-border p-4 card-glow">
            <h3 className="font-sans font-semibold text-primary text-sm mb-3">Body Stats</h3>
            <div className="grid grid-cols-3 gap-3">
              <StatItem label="Current" value={`${profile.weightKg}kg`} />
              <StatItem label="Target" value={`${profile.targetWeightKg}kg`} />
              <StatItem label="BMI" value={`${profile.bmi}`} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <StatItem label="Goal" value={profile.primaryGoal.replace(/_/g, ' ')} />
              <StatItem label="Intensity" value={profile.dietIntensity} />
            </div>
            <GoalProjectionCard />
          </div>

          {/* Weight Tracking Section */}
          <WeightStatsHeader />
          <ErrorBoundary>
            <WeightProgressChart />
          </ErrorBoundary>
          <WeightLogList />

          <div className="bg-surface rounded-2xl border border-border p-4 card-glow">
            <h3 className="font-sans font-semibold text-primary text-sm mb-3">Daily Nutrition Targets</h3>
            <div className="grid grid-cols-5 gap-2">
              <NutrientItem label="kcal" value={Math.round(profile.targetCalories)} color="text-primary" bgColor="bg-primary/[0.08]" />
              <NutrientItem label="Protein" value={`${Math.round(profile.proteinTarget)}g`} color="text-success" bgColor="bg-success-fill" />
              <NutrientItem label="Carbs" value={`${Math.round(profile.carbTarget)}g`} color="text-accent" bgColor="bg-accent-fill" />
              <NutrientItem label="Fat" value={`${Math.round(profile.fatTarget)}g`} color="text-violet" bgColor="bg-violet-fill" />
              <NutrientItem label="Fibre" value={`${Math.round(profile.fibreTarget)}g`} color="text-fibre" bgColor="bg-fibre-fill" />
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-4 card-glow">
            <h3 className="font-sans font-semibold text-primary text-sm mb-3">Preferences</h3>
            <div className="space-y-2 text-sm font-sans">
              <div className="flex justify-between"><span className="text-secondary">Diet</span><span className="text-primary font-medium">{profile.mealPreference?.replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between"><span className="text-secondary">Cuisines</span><span className="text-primary font-medium">{(profile.cuisinePreferences || []).join(', ')}</span></div>
              <div className="flex justify-between"><span className="text-secondary">Meals/day</span><span className="text-primary font-medium">{profile.mealsPerDay}</span></div>
              <div className="flex justify-between"><span className="text-secondary">Activity</span><span className="text-primary font-medium">{profile.activityLevel?.replace(/_/g, ' ')}</span></div>
            </div>
          </div>
        </>
      )}

      {/* Meal Plan Customiser + Regenerate */}
      <MealPlanCustomiser
        initialValue={mealInstructions}
        onInstructionsChange={handleInstructionsChange}
        onRegenerate={handleRegenerateClick}
        isRegenerating={regenerating}
      />

      <button onClick={logout}
        className="w-full bg-surface border border-red-500/30 text-red-400 font-medium py-3 rounded-[14px] font-sans text-sm hover:bg-red-500/10 transition-colors">
        Logout
      </button>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-5" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full border border-border card-glow">
            {hasInstructions ? (
              <>
                <h3 className="font-display font-bold text-primary text-lg mb-2">Regenerate with your changes?</h3>
                <p className="text-sm text-secondary font-sans mb-3">
                  Your custom instructions will be applied to the new meal plan:
                </p>
                <div className="bg-elevated rounded-xl px-3 py-2.5 mb-3 border border-border">
                  <p className="text-sm text-primary font-sans italic leading-relaxed line-clamp-3">
                    "{mealInstructions.trim()}"
                  </p>
                </div>
                <p className="text-xs text-dimmed font-sans mb-5">
                  Your current tracking data will be reset. This cannot be undone.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-display font-bold text-primary text-lg mb-2">Regenerate Plan?</h3>
                <p className="text-sm text-secondary font-sans mb-5">
                  This will create a brand new 7-day plan based on your profile. Your current tracking data will be reset.
                </p>
              </>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 bg-elevated text-secondary font-medium py-2.5 rounded-[14px] font-sans text-sm border border-border hover:bg-elevated/80 transition-colors">Cancel</button>
              <button onClick={handleRegenerate}
                className="flex-1 bg-accent text-white font-semibold py-2.5 rounded-[14px] font-sans text-sm active:scale-95 transition-all">
                {hasInstructions ? 'Yes, Regenerate' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-4" />

      {/* Weight Log Modal */}
      <WeightLogModal />
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-sans font-bold text-primary text-base">{value}</p>
      <p className="text-xs text-secondary font-sans">{label}</p>
    </div>
  );
}

function NutrientItem({ label, value, color, bgColor }: { label: string; value: string | number; color: string; bgColor: string }) {
  return (
    <div className={`text-center rounded-3xl py-1.5 ${bgColor}`}>
      <p className={`font-bold text-sm font-mono ${color}`}>{value}</p>
      <p className="text-[10px] text-secondary font-sans">{label}</p>
    </div>
  );
}
