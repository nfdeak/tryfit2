import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useWeightStore } from '../../store/weightStore';
import { useWeightChart } from '../../hooks/useWeightChart';
import { TimeRange } from '../../types';

const TIME_RANGES: TimeRange[] = ['1M', '3M', '6M', 'all'];

export function WeightProgressChart() {
  const { logs, projection, selectedTimeRange, setTimeRange } = useWeightStore();
  const { chartData, domain } = useWeightChart(logs, projection, selectedTimeRange);

  if (chartData.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-4 card-glow">
        <h3 className="font-sans font-semibold text-primary text-sm mb-3">Weight Chart</h3>
        <div className="h-40 flex items-center justify-center">
          <p className="text-secondary text-sm font-sans">Log your weight to see the chart</p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().substring(0, 10);

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 card-glow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-sans font-semibold text-primary text-sm">Weight Chart</h3>
        <div className="flex gap-1">
          {TIME_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-medium transition-colors ${
                selectedTimeRange === r
                  ? 'bg-accent text-white'
                  : 'bg-elevated text-secondary hover:text-primary'
              }`}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-violet rounded" />
          <span className="text-[10px] text-secondary font-sans">Projected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-accent rounded" />
          <span className="text-[10px] text-secondary font-sans">Actual</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#5C5869' }}
            tickFormatter={(v: string) => {
              const d = new Date(v);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
            interval="preserveStartEnd"
            stroke="#2A2D3E"
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 9, fill: '#5C5869' }}
            tickFormatter={(v: number) => `${v}`}
            stroke="#2A2D3E"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1D27',
              border: '1px solid #2A2D3E',
              borderRadius: '12px',
              fontSize: '12px',
              fontFamily: '"Inter", sans-serif'
            }}
            labelFormatter={(label: string) => {
              const d = new Date(label);
              return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            }}
            formatter={(value: number, name: string) => [
              `${value} kg`,
              name === 'projected' ? 'Projected' : 'Actual'
            ]}
          />
          <ReferenceLine x={todayStr} stroke="#5C5869" strokeDasharray="3 3" label="" />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="#7B6CF6"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#E8845A"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#E8845A', stroke: '#1A1D27', strokeWidth: 2 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
