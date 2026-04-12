import { useState, useEffect, useRef, useCallback } from 'react';
import { apiUrl } from '../lib/api';

const SUGGESTION_CHIPS = [
  { label: '+ More protein', text: 'Include more high-protein options in every meal' },
  { label: '+ Lighter dinners', text: 'Make dinners lighter, under 300 calories' },
  { label: '+ No repetition', text: 'Do not repeat any meal more than once in the week' },
  { label: '+ Add soups', text: 'Include at least one soup or broth per day' },
  { label: '+ Quick recipes', text: 'All meals should be cookable in under 20 minutes' },
  { label: '+ Budget friendly', text: 'Keep meals budget-friendly using affordable ingredients' },
  { label: '+ More variety', text: 'Maximise variety across all 7 days' },
  { label: '+ Less spicy', text: 'Keep all meals mild, minimal chilli and spices' },
  { label: '+ Bigger breakfast', text: 'Make breakfast the largest meal of the day' },
];

const MAX_CHARS = 500;

interface MealPlanCustomiserProps {
  initialValue: string;
  onInstructionsChange: (text: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function MealPlanCustomiser({
  initialValue,
  onInstructionsChange,
  onRegenerate,
  isRegenerating,
}: MealPlanCustomiserProps) {
  const [text, setText] = useState(initialValue);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync initial value on mount / when it changes externally
  useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const lineHeight = 20;
      const minHeight = lineHeight * 4; // 4 rows min
      const maxHeight = lineHeight * 10; // 10 rows max
      el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`;
    }
  }, [text]);

  const saveInstructions = useCallback(async (value: string) => {
    setSaveStatus('saving');
    try {
      const res = await fetch(apiUrl('/api/profile/meal-instructions'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ instructions: value }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, []);

  const handleChange = (value: string) => {
    // Truncate if pasted text exceeds limit
    const truncated = value.length > MAX_CHARS ? value.substring(0, MAX_CHARS) : value;
    setText(truncated);
    onInstructionsChange(truncated);

    // Debounced auto-save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveInstructions(truncated), 500);
  };

  const handleChipClick = (chipText: string) => {
    const newText = text.trim()
      ? `${text.trim()}, ${chipText}`
      : chipText;
    const truncated = newText.length > MAX_CHARS ? newText.substring(0, MAX_CHARS) : newText;
    setText(truncated);
    onInstructionsChange(truncated);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveInstructions(truncated), 500);
  };

  const handleClear = () => {
    setText('');
    onInstructionsChange('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    saveInstructions('');
  };

  const charCount = text.length;
  const charColor = charCount >= 480 ? 'text-red-400' : charCount >= 400 ? 'text-accent' : 'text-dimmed';
  const hasInstructions = text.trim().length > 0;

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 space-y-3 card-glow">
      {/* Header */}
      <div>
        <h3 className="font-display text-base font-bold text-primary flex items-center gap-2">
          Customise Your Next Meal Plan
        </h3>
        <p className="text-xs text-secondary font-sans mt-1 leading-relaxed">
          Tell us anything you'd like changed. This will be used the next time you regenerate your plan.
        </p>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isRegenerating}
          placeholder='e.g. Add more eggs to breakfast, avoid rajma this week, make dinners lighter, include a soup every day, no fish on Fridays...'
          className="w-full bg-dark border-[1.5px] border-border rounded-xl px-3.5 py-3 font-sans text-sm text-primary placeholder-dimmed resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors disabled:opacity-50"
          style={{ minHeight: '80px' }}
          maxLength={MAX_CHARS}
        />
      </div>

      {/* Bottom row: Clear + Save status + Character counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hasInstructions && (
            <button
              onClick={handleClear}
              disabled={isRegenerating}
              className="text-xs text-secondary font-sans font-medium underline underline-offset-2 hover:text-primary transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          )}
          {/* Save status indicator */}
          <span className={`text-[11px] font-sans transition-opacity duration-300 ${
            saveStatus === 'saved' ? 'text-success opacity-100' :
            saveStatus === 'saving' ? 'text-secondary opacity-100' :
            saveStatus === 'error' ? 'text-red-400 opacity-100' :
            'opacity-0'
          }`}>
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'error' && "Couldn't save — will retry"}
          </span>
        </div>
        <span className={`text-xs font-sans font-medium font-mono ${charColor}`}>
          {charCount} / {MAX_CHARS}
        </span>
      </div>

      {/* Suggestion chips */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleChipClick(chip.text)}
              disabled={isRegenerating || charCount >= MAX_CHARS}
              className="flex-shrink-0 px-3 py-1.5 bg-surface border-[1.5px] border-border rounded-full text-xs font-sans font-semibold text-success hover:bg-elevated active:bg-elevated transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Regenerate button */}
      <button
        onClick={onRegenerate}
        disabled={isRegenerating}
        className={`w-full relative font-semibold py-3.5 rounded-[14px] font-sans text-sm active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          hasInstructions
            ? 'shimmer text-white border-2 border-violet/40'
            : 'bg-accent text-white'
        }`}
      >
        {hasInstructions ? 'Regenerate with My Changes' : 'Regenerate Meal Plan'}
        {/* Indicator dot when instructions are active */}
        {hasInstructions && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full" />
        )}
      </button>
    </div>
  );
}
