import { useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/appStore';

interface Props {
  date: string;
}

export function WaterIntakeCard({ date }: Props) {
  const { waterByDate, setWater, profile } = useAppStore();
  const goal = profile?.waterIntakeGoal || 8;
  const glasses = waterByDate[date] ?? -1; // -1 = not yet loaded

  const fetchWater = useCallback(async () => {
    try {
      const res = await axios.get('/api/water', { params: { date }, withCredentials: true });
      setWater(date, res.data.glasses ?? 0);
    } catch {
      setWater(date, 0);
    }
  }, [date]);

  useEffect(() => {
    if (glasses === -1) fetchWater();
  }, [date, glasses, fetchWater]);

  const handleTap = async (n: number) => {
    const newVal = glasses === n ? n - 1 : n; // tapping same number decrements by 1
    const clamped = Math.max(0, newVal);
    setWater(date, clamped); // optimistic
    try {
      await axios.post('/api/water', { date, glasses: clamped }, { withCredentials: true });
    } catch {
      setWater(date, glasses); // revert
    }
  };

  const displayGlasses = glasses === -1 ? 0 : glasses;
  const mlConsumed = displayGlasses * 250;
  const mlGoal = goal * 250;

  return (
    <div className="bg-surface rounded-2xl p-4 border border-border card-glow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">💧</span>
          <span className="font-sans font-semibold text-primary text-sm">Water Intake</span>
        </div>
        <span className="text-xs text-secondary font-sans font-mono">
          {displayGlasses}/{goal} glasses
        </span>
      </div>

      {/* Glass grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {Array.from({ length: goal }, (_, i) => {
          const glassNum = i + 1;
          const filled = glassNum <= displayGlasses;
          return (
            <button
              key={glassNum}
              onClick={() => handleTap(glassNum)}
              className={`flex flex-col items-center justify-center rounded-xl py-2.5 transition-all active:scale-95 border ${
                filled
                  ? 'bg-[#4CAF82]/20 border-[#4CAF82]/40'
                  : 'bg-elevated border-border'
              }`}
            >
              <span className="text-xl leading-none">{filled ? '🥛' : '🫙'}</span>
              <span className={`text-[10px] font-mono mt-0.5 ${filled ? 'text-[#4CAF82]' : 'text-dimmed'}`}>
                {glassNum}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Progress bar */}
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((displayGlasses / goal) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #4CAF82, #4CAF82cc)',
              }}
            />
          </div>
          <p className="text-[10px] text-secondary font-sans mt-1">
            ~{mlConsumed} ml of ~{mlGoal} ml daily
          </p>
        </div>
      </div>
      <p className="text-[10px] text-dimmed font-sans mt-1">
        ℹ️ 1 standard glass ≈ 250 ml — adjust based on your glass size
      </p>
    </div>
  );
}
