import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { apiUrl } from '../lib/api';
import { OnboardingData } from '../types';
import { COUNTRIES, ALLERGENS, ALLERGEN_ICONS, INGREDIENT_CATEGORIES, INGREDIENT_ICONS, CUISINES, KITCHEN_EQUIPMENT, EQUIPMENT_ICONS, HEALTH_CONDITIONS } from '../data/onboarding';

const INITIAL: OnboardingData = {
  name: '', age: 25, gender: 'male', country: 'India', city: '',
  weightKg: 70, heightCm: 170, targetWeightKg: 65,
  mealPreference: 'non_vegetarian', cuisinePreferences: ['Indian'], mealsPerDay: 4, eatingWindow: 'standard',
  allergies: [], allergyOther: '',
  preferredIngredients: [],
  avoidIngredients: [], avoidOther: '',
  primaryGoal: 'lose_weight', dietIntensity: 'moderate', activityLevel: 'lightly_active',
  healthConditions: [], wakeUpTime: '07:00', sleepTime: '23:00',
  cookingStyle: 'home', kitchenEquipment: ['Stovetop'],
  weeklyBudget: null, budgetCurrency: 'INR', waterIntakeGoal: 8,
  planDuration: 7,
};

interface Props {
  onComplete: () => void;
  userName?: string | null;
}

export function Onboarding({ onComplete, userName }: Props) {
  const { refreshUser, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({ ...INITIAL, name: userName || '' });
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState('');
  const [error, setError] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  const totalSteps = 7;
  const update = (partial: Partial<OnboardingData>) => setData(d => ({ ...d, ...partial }));
  const toggleArr = (field: keyof OnboardingData, val: string) => {
    const arr = (data[field] as string[]) || [];
    update({ [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] } as any);
  };
  const toggleArrMax = (field: keyof OnboardingData, val: string, max: number) => {
    const arr = (data[field] as string[]) || [];
    if (arr.includes(val)) update({ [field]: arr.filter(v => v !== val) } as any);
    else if (arr.length < max) update({ [field]: [...arr, val] } as any);
  };

  const bmi = data.heightCm > 0 ? (data.weightKg / ((data.heightCm / 100) ** 2)).toFixed(1) : '0';
  const weightDiff = (data.weightKg - data.targetWeightKg).toFixed(1);

  const canNext = () => {
    switch (step) {
      case 1: return data.name.trim() && data.age >= 10 && data.age <= 100 && data.country && data.city.trim();
      case 2: return data.weightKg > 0 && data.heightCm > 0 && data.targetWeightKg > 0;
      case 3: return data.mealPreference && data.cuisinePreferences.length > 0;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      case 7: return data.primaryGoal && data.dietIntensity && data.activityLevel;
      default: return true;
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      setGenStep('Saving your profile...');
      await axios.post('/api/profile', data, { withCredentials: true });

      setGenStep('Generating your personalised meal plan...');

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
              if (eventMatch[1] === 'progress') setGenStep(parsed.step);
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
              try { reject(new Error(JSON.parse(xhr.responseText).error || 'Generation failed')); }
              catch { reject(new Error('Generation failed')); }
            } else { reject(new Error('No response received')); }
          }
        };
        xhr.onerror = () => { if (!settled) reject(new Error('Network error')); };
        xhr.ontimeout = () => { if (!settled) reject(new Error('Request timed out')); };
        xhr.send('{}');
      });

      if (!result?.success) throw new Error('Generation failed');

      setGenStep('Done!');
      await refreshUser();
      onComplete();
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate meal plan';
      setError(msg);
      setGenerating(false);
    }
  };

  const handleSkip = async () => {
    setGenerating(true);
    setError('');
    try {
      setGenStep('Saving your profile...');
      await axios.post('/api/profile', data, { withCredentials: true });
      // Profile POST marks onboardingDone=true on the server — no extra call needed.
      await refreshUser();
      onComplete();
    } catch {
      setError('Failed to save profile.');
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-5">
        <div className="text-center max-w-xs">
          <div className="text-6xl mb-6 animate-bounce">🍽️</div>
          <h2 className="font-display text-2xl font-bold text-primary mb-3">Creating Your Plan</h2>
          <p className="text-accent font-sans font-medium mb-6">{genStep}</p>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full shimmer rounded-full" style={{ width: '60%' }} />
          </div>
          {error && (
            <div className="mt-6 bg-red-900/30 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl font-sans">
              {error}
              <button onClick={() => { setGenerating(false); setShowSummary(true); }}
                className="block mt-2 text-accent underline text-sm">Try Again</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="min-h-screen bg-dark">
        <div className="max-w-app mx-auto px-5 py-6">
          <h2 className="font-display text-2xl font-bold text-primary mb-1">Review Your Profile</h2>
          <p className="text-secondary text-sm font-sans mb-5">Confirm everything looks right</p>

          <SummaryCard label="Personal" items={[`${data.name}, ${data.age}y, ${data.gender}`, `${data.city}, ${data.country}`]} onEdit={() => { setShowSummary(false); setStep(1); }} />
          <SummaryCard label="Body" items={[`${data.weightKg}kg → ${data.targetWeightKg}kg`, `Height: ${data.heightCm}cm, BMI: ${bmi}`]} onEdit={() => { setShowSummary(false); setStep(2); }} />
          <SummaryCard label="Diet" items={[data.mealPreference, `${data.mealsPerDay} meals/day`, data.cuisinePreferences.join(', ')]} onEdit={() => { setShowSummary(false); setStep(3); }} />
          <SummaryCard label="Allergies" items={[data.allergies.length > 0 ? data.allergies.join(', ') : 'None']} onEdit={() => { setShowSummary(false); setStep(4); }} />
          <SummaryCard label="Goal" items={[data.primaryGoal, `Intensity: ${data.dietIntensity}`, data.activityLevel]} onEdit={() => { setShowSummary(false); setStep(7); }} />

          {error && <div className="bg-red-900/30 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl font-sans mb-4">{error}</div>}

          <button onClick={handleGenerate}
            className="w-full shimmer text-white font-semibold py-4 rounded-[14px] font-sans text-base active:scale-95 transition-all mb-3">
            Generate My Meal Plan ✨
          </button>
          <button onClick={handleSkip}
            className="w-full bg-surface border border-border text-secondary font-medium py-3 rounded-[14px] font-sans text-sm mb-6 hover:bg-elevated transition-colors">
            Skip — Use default plan for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-app mx-auto flex flex-col min-h-screen">
        {/* Progress bar */}
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-sans font-semibold text-secondary">Step {step} of {totalSteps}</span>
            <div className="flex items-center gap-4">
              {step > 1 && <button onClick={() => setStep(s => s - 1)} className="text-accent text-sm font-sans font-medium">← Back</button>}
              <button onClick={logout} className="text-dimmed text-xs font-sans hover:text-red-400 transition-colors">Logout</button>
            </div>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>

        <div className="flex-1 px-5 py-4 overflow-y-auto pb-24">
          {step === 1 && <StepPersonal data={data} update={update} />}
          {step === 2 && <StepBody data={data} update={update} bmi={bmi} weightDiff={weightDiff} />}
          {step === 3 && <StepDiet data={data} update={update} toggleArr={toggleArrMax} />}
          {step === 4 && <StepAllergies data={data} toggleArr={toggleArr} update={update} />}
          {step === 5 && <StepPreferred data={data} toggleArr={toggleArr} />}
          {step === 6 && <StepAvoid data={data} toggleArr={toggleArr} update={update} />}
          {step === 7 && <StepGoals data={data} update={update} toggleArr={toggleArr} />}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-border px-5 py-3 z-20" style={{ background: 'rgba(15,17,23,0.92)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-app mx-auto">
            <button
              onClick={() => step === totalSteps ? setShowSummary(true) : setStep(s => s + 1)}
              disabled={!canNext()}
              className="w-full bg-accent text-white font-semibold py-3.5 rounded-[14px] font-sans disabled:opacity-40 active:scale-95 transition-all"
            >
              {step === totalSteps ? 'Review & Generate' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, items, onEdit }: { label: string; items: string[]; onEdit: () => void }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 mb-3 card-glow">
      <div className="flex items-center justify-between mb-1">
        <span className="font-sans font-semibold text-primary text-sm">{label}</span>
        <button onClick={onEdit} className="text-accent text-xs font-sans font-medium">Edit</button>
      </div>
      {items.map((item, i) => <p key={i} className="text-sm text-secondary font-sans">{item}</p>)}
    </div>
  );
}

function StepPersonal({ data, update }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void }) {
  const [countrySearch, setCountrySearch] = useState('');
  const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-primary">Personal Details</h2>
      <Field label="Name" value={data.name} onChange={v => update({ name: v })} placeholder="Your name" />
      <div>
        <label className="block text-sm font-medium text-primary mb-1.5 font-sans">Age</label>
        <input type="number" min={10} max={100} value={data.age}
          onChange={e => update({ age: parseInt(e.target.value) || 0 })}
          className="w-full border-[1.5px] border-border rounded-xl px-4 py-3 font-sans text-base bg-surface text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30" />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-1.5 font-sans">Gender</label>
        <div className="grid grid-cols-4 gap-2">
          {['male', 'female', 'other', 'prefer_not_to_say'].map(g => (
            <button key={g} onClick={() => update({ gender: g })}
              className={`py-2 rounded-xl text-sm font-sans font-medium transition-all ${
                data.gender === g ? 'bg-elevated text-primary border border-accent/40' : 'bg-surface border border-border text-secondary'}`}>
              {g === 'prefer_not_to_say' ? 'Skip' : g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-1.5 font-sans">Country</label>
        <input type="text" value={countrySearch || data.country}
          onChange={e => { setCountrySearch(e.target.value); if (!e.target.value) update({ country: '' }); }}
          onFocus={() => setCountrySearch(data.country)}
          className="w-full border-[1.5px] border-border rounded-xl px-4 py-3 font-sans text-base bg-surface text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
          placeholder="Search country..." />
        {countrySearch && filtered.length > 0 && (
          <div className="bg-surface border border-border rounded-xl mt-1 max-h-40 overflow-y-auto">
            {filtered.slice(0, 8).map(c => (
              <button key={c} onClick={() => { update({ country: c }); setCountrySearch(''); }}
                className="w-full text-left px-4 py-2 text-sm font-sans text-primary hover:bg-elevated">{c}</button>
            ))}
          </div>
        )}
      </div>
      <Field label="City" value={data.city} onChange={v => update({ city: v })} placeholder="Your city" />
    </div>
  );
}

function StepBody({ data, update, bmi, weightDiff }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void; bmi: string; weightDiff: string }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-primary">Body Stats</h2>
      <NumField label="Current Weight (kg)" value={data.weightKg} onChange={v => update({ weightKg: v })} />
      <NumField label="Height (cm)" value={data.heightCm} onChange={v => update({ heightCm: v })} />
      <NumField label="Target Weight (kg)" value={data.targetWeightKg} onChange={v => update({ targetWeightKg: v })} />
      <div className="bg-accent-fill rounded-xl p-4 border border-accent/20">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-sans text-primary font-medium">BMI</span>
          <span className="text-sm font-mono font-bold text-accent">{bmi}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-sans text-primary font-medium">{parseFloat(weightDiff) > 0 ? 'To lose' : 'To gain'}</span>
          <span className="text-sm font-mono font-bold text-accent">{Math.abs(parseFloat(weightDiff))} kg</span>
        </div>
      </div>
    </div>
  );
}

function StepDiet({ data, update, toggleArr }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void; toggleArr: (f: keyof OnboardingData, v: string, max: number) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-primary">Diet Preferences</h2>
      <div>
        <label className="block text-sm font-medium text-primary mb-2 font-sans">Meal Preference</label>
        <div className="flex flex-wrap gap-2">
          {['vegetarian', 'non_vegetarian', 'vegan', 'eggetarian', 'pescatarian'].map(p => (
            <button key={p} onClick={() => update({ mealPreference: p })}
              className={`px-4 py-2 rounded-3xl text-sm font-sans font-medium transition-all ${
                data.mealPreference === p ? 'bg-elevated text-primary border border-accent/40' : 'bg-surface border border-border text-secondary'}`}>
              {p.replace('_', '-').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-2 font-sans">Cuisine Preference <span className="text-secondary">(up to 3)</span></label>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map(c => (
            <button key={c} onClick={() => toggleArr('cuisinePreferences', c, 3)}
              className={`px-4 py-2 rounded-3xl text-sm font-sans font-medium transition-all ${
                data.cuisinePreferences.includes(c) ? 'bg-accent text-white' : 'bg-surface border border-border text-secondary'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-2 font-sans">Meals per day</label>
        <div className="flex gap-2">
          {[3, 4, 5].map(n => (
            <button key={n} onClick={() => update({ mealsPerDay: n })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-sans font-medium transition-all ${
                data.mealsPerDay === n ? 'bg-elevated text-primary border border-accent/40' : 'bg-surface border border-border text-secondary'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-2 font-sans">Eating Window</label>
        <div className="space-y-2">
          {[
            { val: 'standard', label: 'Standard (6am–10pm)' },
            { val: '16_8', label: 'Intermittent Fasting 16:8' },
            { val: '18_6', label: 'Intermittent Fasting 18:6' }
          ].map(o => (
            <button key={o.val} onClick={() => update({ eatingWindow: o.val })}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-sans font-medium transition-all ${
                data.eatingWindow === o.val ? 'bg-elevated text-primary border border-accent/40' : 'bg-surface border border-border text-secondary'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepAllergies({ data, toggleArr, update }: { data: OnboardingData; toggleArr: (f: keyof OnboardingData, v: string) => void; update: (p: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-primary">Allergies & Intolerances</h2>
      <p className="text-sm text-secondary font-sans">Tap to select any that apply</p>
      <div className="grid grid-cols-3 gap-2.5">
        {ALLERGENS.map(a => {
          const selected = data.allergies.includes(a);
          return (
            <button key={a} onClick={() => toggleArr('allergies', a)}
              className={`relative flex flex-col items-center justify-center rounded-2xl py-4 px-2 transition-all active:scale-97 ${
                selected ? 'bg-red-500/20 border-[1.5px] border-red-500/50' : 'bg-surface border-[1.5px] border-border'}`}>
              {selected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">✓</span>
                </div>
              )}
              <span className="text-2xl mb-1.5">{ALLERGEN_ICONS[a] || '⚠️'}</span>
              <span className={`text-xs font-sans font-medium text-center leading-tight ${selected ? 'text-red-400' : 'text-secondary'}`}>{a}</span>
            </button>
          );
        })}
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-1.5 font-sans">Any other allergies?</label>
        <input type="text" value={data.allergyOther} onChange={e => update({ allergyOther: e.target.value })}
          className="w-full border-[1.5px] border-border rounded-xl px-4 py-3 font-sans text-base bg-surface text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
          placeholder="E.g. citrus, certain spices..." />
      </div>
    </div>
  );
}

function StepPreferred({ data, toggleArr }: { data: OnboardingData; toggleArr: (f: keyof OnboardingData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary">Choose your staples</h2>
        <p className="text-sm text-secondary font-sans mt-1">Tap ingredients you love. Min 5 recommended.</p>
      </div>
      {data.preferredIngredients.length < 5 && (
        <div className="bg-accent-fill rounded-xl px-3 py-2.5 text-xs text-accent font-sans border border-accent/20 font-medium">
          {data.preferredIngredients.length}/5 selected — add more for better results
        </div>
      )}
      {INGREDIENT_CATEGORIES.map(cat => (
        <div key={cat.name}>
          <label className="block text-sm font-semibold text-secondary uppercase tracking-wide mb-2.5 font-sans">{cat.name}</label>
          <div className="grid grid-cols-3 gap-2.5">
            {cat.items.map(item => {
              const selected = data.preferredIngredients.includes(item);
              return (
                <button key={item} onClick={() => toggleArr('preferredIngredients', item)}
                  className={`relative flex flex-col items-center justify-center rounded-2xl py-4 px-2 transition-all active:scale-97 ${
                    selected ? 'bg-success/15 border-[1.5px] border-success/40' : 'bg-surface border-[1.5px] border-border'}`}>
                  {selected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">✓</span>
                    </div>
                  )}
                  <span className="text-2xl mb-1.5">{INGREDIENT_ICONS[item] || '🍽️'}</span>
                  <span className={`text-xs font-sans font-medium text-center leading-tight ${selected ? 'text-success' : 'text-secondary'}`}>{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepAvoid({ data, toggleArr, update }: { data: OnboardingData; toggleArr: (f: keyof OnboardingData, v: string) => void; update: (p: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary">Ingredients to Avoid</h2>
        <p className="text-sm text-secondary font-sans mt-1">Tap ingredients you dislike or want to avoid.</p>
      </div>
      {INGREDIENT_CATEGORIES.map(cat => (
        <div key={cat.name}>
          <label className="block text-sm font-semibold text-secondary uppercase tracking-wide mb-2.5 font-sans">{cat.name}</label>
          <div className="grid grid-cols-3 gap-2.5">
            {cat.items.map(item => {
              const isAllergen = data.allergies.some(a => item.toLowerCase().includes(a.toLowerCase()));
              const selected = data.avoidIngredients.includes(item);
              return (
                <button key={item} onClick={() => !isAllergen && toggleArr('avoidIngredients', item)}
                  disabled={isAllergen}
                  className={`relative flex flex-col items-center justify-center rounded-2xl py-4 px-2 transition-all active:scale-97 ${
                    isAllergen ? 'bg-red-500/10 border-[1.5px] border-red-500/30 cursor-not-allowed opacity-50' :
                    selected ? 'bg-red-500/15 border-[1.5px] border-red-500/40' : 'bg-surface border-[1.5px] border-border'}`}>
                  {selected && !isAllergen && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">✓</span>
                    </div>
                  )}
                  {isAllergen && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-red-500/60 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px]">⚠</span>
                    </div>
                  )}
                  <span className="text-2xl mb-1.5">{INGREDIENT_ICONS[item] || '🍽️'}</span>
                  <span className={`text-xs font-sans font-medium text-center leading-tight ${
                    isAllergen ? 'text-red-400/60' : selected ? 'text-red-400' : 'text-secondary'}`}>{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-primary mb-1.5 font-sans">Any other ingredients to avoid?</label>
        <input type="text" value={data.avoidOther} onChange={e => update({ avoidOther: e.target.value })}
          className="w-full border-[1.5px] border-border rounded-xl px-4 py-3 font-sans text-base bg-surface text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
          placeholder="E.g. bitter gourd, liver..." />
      </div>
    </div>
  );
}

function StepGoals({ data, update, toggleArr }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void; toggleArr: (f: keyof OnboardingData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-primary">Goals & Lifestyle</h2>
      <div>
        <label className="block text-sm font-medium text-primary mb-2 font-sans">Primary Goal</label>
        <div className="space-y-2">
          {[
            { val: 'lose_weight', label: 'Lose Weight' },
            { val: 'maintain', label: 'Maintain Weight' },
            { val: 'gain_muscle', label: 'Gain Muscle' },
            { val: 'improve_fitness', label: 'Improve Fitness' },
            { val: 'manage_health', label: 'Manage Health Condition' }
          ].map(g => (
            <button key={g.val} onClick={() => update({ primaryGoal: g.val })}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-sans font-medium transition-all ${
                data.primaryGoal === g.val ? 'bg-elevated text-primary border border-accent/40' : 'bg-surface border border-border text-secondary'}`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-2 font-sans">Plan Duration</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: 7, label: '7-Day Plan', desc: 'One week of meals' },
            { val: 14, label: '14-Day Plan', desc: 'Maximum variety', badge: '⭐ Recommended' },
          ].map(o => (
            <button key={o.val} onClick={() => update({ planDuration: o.val })}
              className={`relative text-left px-4 py-3 rounded-xl text-sm font-sans transition-all ${
                data.planDuration === o.val ? 'bg-elevated text-primary border border-accent/40' : 'bg-surface border border-border text-secondary'}`}>
              {o.badge && (
                <span className="absolute -top-2 right-2 bg-accent text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{o.badge}</span>
              )}
              <span className="font-semibold block">{o.label}</span>
              <span className={`text-xs mt-0.5 block ${data.planDuration === o.val ? 'text-secondary' : 'text-dimmed'}`}>{o.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-2 font-sans">Diet Intensity</label>
        {[
          { val: 'low', emoji: '🟢', label: 'Low', desc: 'Mild deficit (~300 kcal). Gradual, sustainable.' },
          { val: 'moderate', emoji: '🟡', label: 'Moderate', desc: 'Standard deficit (~500 kcal). Steady 0.5kg/week. Recommended.' },
          { val: 'high', emoji: '🔴', label: 'High', desc: 'Aggressive deficit (~750 kcal). Fast results, requires discipline.' }
        ].map(i => (
          <button key={i.val} onClick={() => update({ dietIntensity: i.val })}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-sans mb-2 transition-all ${
              data.dietIntensity === i.val ? 'bg-elevated text-primary border border-accent/40' : 'bg-surface border border-border text-secondary'}`}>
            <span className="font-medium">{i.emoji} {i.label}</span>
            <p className={`text-xs mt-0.5 ${data.dietIntensity === i.val ? 'text-secondary' : 'text-dimmed'}`}>{i.desc}</p>
          </button>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-2 font-sans">Activity Level</label>
        {[
          { val: 'sedentary', label: 'Sedentary (desk job)' },
          { val: 'lightly_active', label: 'Lightly Active (1–2 workouts/week)' },
          { val: 'moderately_active', label: 'Moderately Active (3–4 workouts/week)' },
          { val: 'very_active', label: 'Very Active (5+ workouts/week)' }
        ].map(a => (
          <button key={a.val} onClick={() => update({ activityLevel: a.val })}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-sans font-medium mb-2 transition-all ${
              data.activityLevel === a.val ? 'bg-elevated text-primary border border-accent/40' : 'bg-surface border border-border text-secondary'}`}>
            {a.label}
          </button>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-2 font-sans">Health Conditions</label>
        <div className="flex flex-wrap gap-2">
          {HEALTH_CONDITIONS.map(h => (
            <button key={h} onClick={() => {
              if (h === 'None') update({ healthConditions: ['None'] });
              else { const arr = data.healthConditions.filter(x => x !== 'None'); toggleArr('healthConditions', h); }
            }}
              className={`px-4 py-2 rounded-3xl text-sm font-sans font-medium transition-all ${
                data.healthConditions.includes(h) ? 'bg-accent text-white' : 'bg-surface border border-border text-secondary'}`}>
              {h}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-primary mb-1 font-sans">Wake Up</label>
          <input type="time" value={data.wakeUpTime} onChange={e => update({ wakeUpTime: e.target.value })}
            className="w-full border-[1.5px] border-border rounded-xl px-3 py-2.5 font-sans text-sm bg-surface text-primary focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary mb-1 font-sans">Sleep</label>
          <input type="time" value={data.sleepTime} onChange={e => update({ sleepTime: e.target.value })}
            className="w-full border-[1.5px] border-border rounded-xl px-3 py-2.5 font-sans text-sm bg-surface text-primary focus:outline-none focus:border-accent" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-2 font-sans">Cooking Style</label>
        <div className="flex gap-2">
          {[{ val: 'home', label: 'Home' }, { val: 'mix', label: 'Mix' }, { val: 'outside', label: 'Mostly Outside' }].map(c => (
            <button key={c.val} onClick={() => update({ cookingStyle: c.val })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-sans font-medium transition-all ${
                data.cookingStyle === c.val ? 'bg-elevated text-primary border border-accent/40' : 'bg-surface border border-border text-secondary'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-2 font-sans">Kitchen Equipment</label>
        <div className="grid grid-cols-3 gap-2.5">
          {KITCHEN_EQUIPMENT.map(e => {
            const selected = data.kitchenEquipment.includes(e);
            return (
              <button key={e} onClick={() => toggleArr('kitchenEquipment', e)}
                className={`relative flex flex-col items-center justify-center rounded-2xl py-4 px-2 transition-all active:scale-97 ${
                  selected ? 'bg-success/15 border-[1.5px] border-success/40' : 'bg-surface border-[1.5px] border-border'}`}>
                {selected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </div>
                )}
                <span className="text-2xl mb-1.5">{EQUIPMENT_ICONS[e] || '🔧'}</span>
                <span className={`text-xs font-sans font-medium text-center leading-tight ${selected ? 'text-success' : 'text-secondary'}`}>{e}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-1 font-sans">Water Intake Goal (glasses/day)</label>
        <input type="range" min={4} max={16} value={data.waterIntakeGoal}
          onChange={e => update({ waterIntakeGoal: parseInt(e.target.value) })}
          className="w-full accent-accent" />
        <span className="text-sm font-mono text-accent font-bold">{data.waterIntakeGoal} glasses</span>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-primary mb-1.5 font-sans">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border-[1.5px] border-border rounded-xl px-4 py-3 font-sans text-base bg-surface text-primary placeholder-dimmed focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30" />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-primary mb-1.5 font-sans">{label}</label>
      <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full border-[1.5px] border-border rounded-xl px-4 py-3 font-sans text-base bg-surface text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30" />
    </div>
  );
}
