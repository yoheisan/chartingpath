import React from 'react';

interface GaugeProps {
  value: number;
  label: string;
  color: string;
}

const Gauge: React.FC<GaugeProps> = ({ value, label, color }) => {
  const radius = 44;
  const circumference = Math.PI * radius;
  const progress = (value / 100) * circumference;

  const strokeColors: Record<string, string> = {
    emerald: 'hsl(160, 84%, 39%)',
    amber: 'hsl(38, 92%, 50%)',
    red: 'hsl(0, 84%, 60%)',
    blue: 'hsl(217, 91%, 60%)',
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        {/* Background arc */}
        <path
          d="M 12 62 A 48 48 0 0 1 108 62"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="7"
          opacity="0.3"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 12 62 A 48 48 0 0 1 108 62"
          fill="none"
          stroke={strokeColors[color] || strokeColors.blue}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className="transition-all duration-700 ease-out"
        />
        {/* Center value */}
        <text x="60" y="55" textAnchor="middle" className="fill-foreground text-base font-bold font-mono">
          {value.toFixed(0)}%
        </text>
      </svg>
      <span className="text-xs text-muted-foreground mt-1 font-medium">{label}</span>
    </div>
  );
};

interface AgentGaugesProps {
  takeRate: number;
  watchRate: number;
  skipRate: number;
  avgScore: number;
}

export const AgentGauges: React.FC<AgentGaugesProps> = ({ takeRate, watchRate, skipRate, avgScore }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Gauge value={takeRate} label="Take Rate" color="emerald" />
      <Gauge value={watchRate} label="Watch Rate" color="amber" />
      <Gauge value={skipRate} label="Skip Rate" color="red" />
      <Gauge value={avgScore} label="Avg Score" color="blue" />
    </div>
  );
};
