import { useGoalProjection } from '../../hooks/useGoalProjection';

export function GoalProjectionCard() {
  const { weeksLeft, monthsLeft, goalDate, targetWeight, weeklyLossKg } = useGoalProjection();

  if (!goalDate) return null;

  const formattedDate = new Date(goalDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-violet-fill rounded-xl border border-violet/20 p-3 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-violet text-sm">🎯</span>
        <h4 className="font-sans font-semibold text-violet text-xs">Goal Projection</h4>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="font-mono font-bold text-primary text-sm">{targetWeight} kg</p>
          <p className="text-[10px] text-secondary font-sans">Target</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-primary text-sm">{formattedDate}</p>
          <p className="text-[10px] text-secondary font-sans">Est. Date</p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-primary text-sm">
            {monthsLeft > 0 ? `${monthsLeft}mo` : `${weeksLeft}w`}
          </p>
          <p className="text-[10px] text-secondary font-sans">Remaining</p>
        </div>
      </div>
      <p className="text-[10px] text-dimmed font-sans mt-2 text-center">
        ~{weeklyLossKg} kg/week projected loss rate
      </p>
    </div>
  );
}
