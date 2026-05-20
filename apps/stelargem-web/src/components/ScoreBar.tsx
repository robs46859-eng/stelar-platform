interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export default function ScoreBar({ label, value, max = 100, color = 'bg-emerald-500' }: ScoreBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-8 text-right">{value}</span>
    </div>
  );
}
