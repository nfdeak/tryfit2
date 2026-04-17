interface CircularMacroRingProps {
  label: string;
  consumed: number;
  target: number;
  unit: 'kcal' | 'g';
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function CircularMacroRing({
  label, consumed, target, unit, color,
  size = 88, strokeWidth = 8,
}: CircularMacroRingProps) {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);

  const isOver = consumed > target;
  const isNearTarget = !isOver && consumed > target * 0.9;
  const displayColor = isOver ? '#DC2626' : isNearTarget ? '#F0B429' : color;
  const pctDisplay = Math.round(pct * 100);

  const consumedDisplay = unit === 'kcal'
    ? Math.round(consumed).toLocaleString()
    : Math.round(consumed).toString();
  const targetDisplay = unit === 'kcal'
    ? Math.round(target).toLocaleString()
    : Math.round(target).toString();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
    }}>
      {/* Label */}
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color: 'var(--color-dimmed, #6B7280)',
        fontFamily: 'sans-serif',
      }}>
        {label}
      </span>

      {/* SVG ring */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)', display: 'block' }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2A2D3E"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={displayColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease',
            }}
          />
        </svg>

        {/* Centre text — percentage */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: size >= 96 ? 15 : 13,
            fontWeight: 700,
            color: displayColor,
            fontFamily: 'DM Mono, monospace',
            lineHeight: 1,
          }}>
            {pctDisplay}%
          </span>
        </div>
      </div>

      {/* Consumed / Target */}
      <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
        <div>
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: displayColor,
            fontFamily: 'DM Mono, monospace',
          }}>
            {consumedDisplay}
          </span>
          <span style={{ fontSize: 10, color: '#6B7280' }}>
            {unit === 'kcal' ? '' : 'g'}
          </span>
        </div>
        <div>
          <span style={{ fontSize: 10, color: '#6B7280' }}>
            /{targetDisplay}{unit === 'kcal' ? ' kcal' : 'g'}
          </span>
        </div>
      </div>
    </div>
  );
}

export const MACRO_COLORS = {
  calories: '#E8845A',
  protein:  '#4CAF82',
  carbs:    '#7B6CF6',
  fat:      '#F0B429',
  fibre:    '#64B5F6',
} as const;
