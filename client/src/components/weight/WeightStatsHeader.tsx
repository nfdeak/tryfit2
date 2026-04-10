import { useWeightStore } from '../../store/weightStore';

export function WeightStatsHeader() {
  const { logs, openLogModal, getCurrentWeight, getTotalLost, getProgressPercent } = useWeightStore();

  if (logs.length === 0) return null;

  const startW = logs[0].weightKg;
  const currentW = getCurrentWeight();
  const totalLost = getTotalLost();
  const progress = getProgressPercent();

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 card-glow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-sans font-semibold text-primary text-sm">Weight Progress</h3>
        <button
          onClick={() => openLogModal()}
          className="bg-accent text-white text-xs font-semibold px-3 py-1.5 rounded-full font-sans active:scale-95 transition-all"
        >
          + Log Weight
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <p className="font-mono font-bold text-primary text-base">{startW}</p>
          <p className="text-[10px] text-secondary font-sans">Started</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-accent text-base">{currentW}</p>
          <p className="text-[10px] text-secondary font-sans">Current</p>
        </div>
        <div className="text-center">
          <p className={`font-mono font-bold text-base ${totalLost > 0 ? 'text-success' : totalLost < 0 ? 'text-red-400' : 'text-primary'}`}>
            {totalLost > 0 ? '-' : totalLost < 0 ? '+' : ''}{Math.abs(totalLost)} kg
          </p>
          <p className="text-[10px] text-secondary font-sans">Lost</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent to-success rounded-full progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] text-dimmed font-sans mt-1 text-right">{progress}% to goal</p>
    </div>
  );
}
