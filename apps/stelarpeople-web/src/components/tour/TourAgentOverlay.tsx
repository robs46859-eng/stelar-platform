import { useEffect, useRef, useState } from 'react';

export interface NarrationSegment {
  key: string;
  icon: string;
  label: string;
  text: string;
  heading_deg: number | null;
  duration_sec: number;
  severity?: string;
  flags?: string[];
  inspection_prompts?: string[];
}

interface Props {
  segments: NarrationSegment[];
  currentHeading?: number;
  onRequestHeading?: (heading: number) => void;
}

const SEGMENT_ICONS: Record<string, string> = {
  route_to_door: '🏠',
  parking: '🚗',
  transit_access: '🚌',
  exterior_condition: '🔍',
  entry_points: '🚪',
  neighborhood_pulse: '🌆',
  fraud_check: '⚠',
};

function severityColor(severity?: string) {
  if (severity === 'critical' || severity === 'high') return 'border-red-400 bg-red-950/80';
  if (severity === 'medium') return 'border-amber-400 bg-amber-950/80';
  return 'border-emerald-500 bg-slate-900/90';
}

export default function TourAgentOverlay({ segments, currentHeading, onRequestHeading }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speechSupported] = useState(() => 'speechSynthesis' in window);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = segments[activeIdx];

  // Auto-advance when playing
  useEffect(() => {
    if (!playing || !active) return;

    // Jump panorama to segment heading
    if (active.heading_deg !== null) onRequestHeading?.(active.heading_deg);

    // Text-to-speech
    if (speechSupported) {
      const utterance = new SpeechSynthesisUtterance(active.text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }

    timerRef.current = setTimeout(() => {
      if (activeIdx < segments.length - 1) {
        setActiveIdx((i) => i + 1);
      } else {
        setPlaying(false);
        window.speechSynthesis?.cancel();
      }
    }, active.duration_sec * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, [playing, activeIdx, active, segments.length, speechSupported, onRequestHeading]);

  function goTo(idx: number) {
    setPlaying(false);
    window.speechSynthesis?.cancel();
    setActiveIdx(idx);
    const seg = segments[idx];
    if (seg?.heading_deg !== null && seg.heading_deg !== undefined) onRequestHeading?.(seg.heading_deg);
  }

  if (!active) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-auto p-4 space-y-2">
      {/* Segment selector pills */}
      <div className="flex gap-1 flex-wrap justify-center">
        {segments.map((seg, i) => (
          <button
            key={seg.key}
            onClick={() => goTo(i)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
              i === activeIdx
                ? 'bg-emerald-500 text-white'
                : 'bg-black/50 text-slate-300 hover:bg-black/70'
            }`}
          >
            {seg.icon} {seg.label}
          </button>
        ))}
      </div>

      {/* Active narration bubble */}
      <div
        className={`rounded-xl border backdrop-blur-md p-4 pointer-events-auto transition-all ${severityColor(active.severity)}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{active.icon}</span>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{active.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded transition-colors"
            >
              {playing ? '⏸ Pause' : '▶ Play tour'}
            </button>
            {speechSupported && (
              <span className="text-xs text-slate-500 ml-1">🔊</span>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed">{active.text}</p>

        {/* Fraud flags */}
        {active.flags && active.flags.length > 0 && (
          <ul className="mt-2 space-y-1">
            {active.flags.map((flag, i) => (
              <li key={i} className="text-xs text-red-300 flex items-start gap-1">
                <span className="shrink-0">•</span>{flag}
              </li>
            ))}
          </ul>
        )}

        {/* Inspection prompts */}
        {active.inspection_prompts && active.inspection_prompts.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-400 mb-1 font-semibold">When you visit, check:</p>
            <ul className="space-y-0.5">
              {active.inspection_prompts.map((p, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-1">
                  <span className="shrink-0 text-emerald-400">✓</span>{p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/50">
          <button
            onClick={() => goTo(Math.max(0, activeIdx - 1))}
            disabled={activeIdx === 0}
            className="text-xs text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-500">{activeIdx + 1} / {segments.length}</span>
          <button
            onClick={() => goTo(Math.min(segments.length - 1, activeIdx + 1))}
            disabled={activeIdx === segments.length - 1}
            className="text-xs text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* AI disclaimer */}
      <p className="text-center text-xs text-slate-500">
        AI-generated narration — informational only · Not a verified source
      </p>
    </div>
  );
}
