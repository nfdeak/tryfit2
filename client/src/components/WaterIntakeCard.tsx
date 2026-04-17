import { useEffect, useCallback, useState } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/appStore';

interface Props {
  date: string;
}

export function WaterIntakeCard({ date }: Props) {
  const { waterByDate, setWater, profile } = useAppStore();
  const goal = profile?.waterIntakeGoal || 8;
  const glasses = waterByDate[date] ?? -1; // -1 = not yet loaded
  const [showTooltip, setShowTooltip] = useState(false);

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
    const newVal = glasses === n ? n - 1 : n;
    const clamped = Math.max(0, newVal);
    setWater(date, clamped);
    try {
      await axios.post('/api/water', { date, glasses: clamped }, { withCredentials: true });
    } catch {
      setWater(date, glasses);
    }
  };

  const displayGlasses = glasses === -1 ? 0 : glasses;
  const litres = (displayGlasses * 0.25).toFixed(1).replace(/\.0$/, '');

  return (
    <div
      className="bg-surface rounded-2xl border border-border card-glow"
      style={{ padding: '10px 14px' }}
    >
      <div className="flex items-center gap-3">
        {/* Label */}
        <span className="text-xs font-bold font-sans text-primary flex-shrink-0">💧 Water</span>

        {/* Dot grid */}
        <div className="flex items-center gap-[5px] flex-1">
          {Array.from({ length: goal }, (_, i) => {
            const dotNum = i + 1;
            const filled = dotNum <= displayGlasses;
            return (
              <button
                key={dotNum}
                onClick={() => handleTap(dotNum)}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: filled ? '#4CAF82' : '#2A2D3E',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background-color 150ms',
                }}
              />
            );
          })}
        </div>

        {/* Count + info icon */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs font-sans text-secondary font-mono whitespace-nowrap">
            {displayGlasses}/{goal} · ~{litres}L
          </span>
          <button
            onClick={() => setShowTooltip(v => !v)}
            className="text-dimmed text-[10px] leading-none hover:text-secondary transition-colors"
            style={{ lineHeight: 1 }}
          >
            ℹ
          </button>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <p className="text-[10px] text-dimmed font-sans mt-1.5 pl-1">
          1 standard glass ≈ 250 ml — adjust based on your glass size
        </p>
      )}
    </div>
  );
}
