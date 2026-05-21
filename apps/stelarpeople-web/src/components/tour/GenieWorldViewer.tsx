import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.ts';

type Action = 'forward' | 'backward' | 'pan_left' | 'pan_right' | 'look_up' | 'look_down' | 'turn_left' | 'turn_right';
type Tier = 'standard' | 'standard_ref' | 'premium' | 'showcase';
type SessionStatus = 'idle' | 'creating' | 'generating' | 'ready' | 'partial' | 'failed';

interface GenieClip {
  action: Action;
  status: 'ready' | 'generating' | 'failed';
  clip_b64?: string;
  clip_url?: string;
  duration?: number;
  model?: string;
}

interface GenieSession {
  session_id: string;
  status: string;
  navigable_actions: Action[];
  clips: Record<Action, GenieClip>;
  scene_analysis: Record<string, unknown>;
  created_at: string;
  expires_at: string;
}

interface Props {
  sourceImageB64: string;
  context?: Record<string, unknown>;
  tier?: Tier;
  sessionId?: string;
  onSessionReady?: (sessionId: string) => void;
}

const ACTION_LABELS: Record<Action, { icon: string; label: string; key: string }> = {
  forward:    { icon: '↑', label: 'Forward',   key: 'ArrowUp' },
  backward:   { icon: '↓', label: 'Back',      key: 'ArrowDown' },
  pan_left:   { icon: '←', label: 'Pan Left',  key: 'ArrowLeft' },
  pan_right:  { icon: '→', label: 'Pan Right', key: 'ArrowRight' },
  look_up:    { icon: '⬆', label: 'Look Up',   key: 'PageUp' },
  look_down:  { icon: '⬇', label: 'Look Down', key: 'PageDown' },
  turn_left:  { icon: '↺', label: 'Turn Left', key: 'q' },
  turn_right: { icon: '↻', label: 'Turn Right',key: 'e' },
};

const POLL_INTERVAL_MS = 4000;

export default function GenieWorldViewer({ sourceImageB64, context = {}, tier = 'standard_ref', sessionId: initialSessionId, onSessionReady }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [session, setSession] = useState<GenieSession | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Session creation ───────────────────────────────────────────────────────

  async function createSession() {
    setSessionStatus('creating');
    setError('');
    try {
      const res = await api.post<{ session_id: string }>('/api/genie/session', {
        source_image_b64: sourceImageB64,
        context,
        tier,
      });
      setSessionId(res.session_id);
      setSessionStatus('generating');
      onSessionReady?.(res.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create world session.');
      setSessionStatus('failed');
    }
  }

  // ── Session polling ────────────────────────────────────────────────────────

  const pollSession = useCallback(async (id: string) => {
    try {
      const res = await api.get<GenieSession>(`/api/genie/session/${id}`);
      setSession(res);
      const s = res.status as SessionStatus;
      setSessionStatus(s);
      if (s === 'ready' || s === 'partial') {
        clearInterval(pollRef.current!);
        // Auto-play the first available clip
        const firstAction = res.navigable_actions.find(a => res.clips[a]?.status === 'ready');
        if (firstAction) playClip(firstAction, res);
      } else if (s === 'failed') {
        clearInterval(pollRef.current!);
      }
    } catch {
      // ignore transient poll errors
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionId || sessionStatus === 'ready' || sessionStatus === 'partial' || sessionStatus === 'failed') return;
    pollRef.current = setInterval(() => pollSession(sessionId), POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current!);
  }, [sessionId, sessionStatus, pollSession]);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!session) return;
      const match = Object.entries(ACTION_LABELS).find(([, v]) => v.key === e.key);
      if (match) {
        const action = match[0] as Action;
        if (session.clips[action]?.status === 'ready') navigate(action);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Clip playback ─────────────────────────────────────────────────────────

  function clipSrc(clip: GenieClip): string {
    if (clip.clip_url) return clip.clip_url;
    if (clip.clip_b64) return `data:video/mp4;base64,${clip.clip_b64}`;
    return '';
  }

  function playClip(action: Action, s: GenieSession = session!) {
    const clip = s.clips[action];
    if (!clip || clip.status !== 'ready' || !videoRef.current) return;
    const src = clipSrc(clip);
    if (!src) return;
    videoRef.current.src = src;
    videoRef.current.play().catch(() => {});
    setCurrentAction(action);
  }

  function navigate(action: Action) {
    if (!session || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      playClip(action);
      setIsTransitioning(false);
    }, 200);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const readyClips = session ? Object.entries(session.clips).filter(([, c]) => c.status === 'ready').length : 0;
  const totalClips = session ? session.navigable_actions.length : 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Genie World</p>
          <p className="text-xs text-slate-400">Navigate AI-generated environment</p>
        </div>
        {sessionStatus === 'idle' && (
          <button
            onClick={createSession}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Generate World
          </button>
        )}
      </div>

      {/* Generating state */}
      {(sessionStatus === 'creating' || sessionStatus === 'generating') && (
        <div className="rounded-xl bg-slate-900 aspect-video flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">
              {sessionStatus === 'creating' ? 'Initializing…' : 'Generating navigable world…'}
            </p>
            {totalClips > 0 && (
              <p className="text-xs text-slate-400 mt-1">{readyClips} of {totalClips} directions ready</p>
            )}
          </div>
        </div>
      )}

      {/* Video viewer */}
      {(sessionStatus === 'ready' || sessionStatus === 'partial') && (
        <div className="relative rounded-xl overflow-hidden bg-slate-900">
          <video
            ref={videoRef}
            className={`w-full aspect-video object-cover transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            playsInline
            loop
            muted
          />

          {/* Direction HUD */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {(['pan_left', 'forward', 'pan_right', 'backward'] as Action[]).map(action => {
              const clip = session?.clips[action];
              const available = clip?.status === 'ready';
              const active = currentAction === action;
              const info = ACTION_LABELS[action];
              return (
                <button
                  key={action}
                  onClick={() => available && navigate(action)}
                  disabled={!available}
                  title={info.label}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                    active
                      ? 'bg-indigo-500 text-white shadow-lg scale-110'
                      : available
                        ? 'bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm'
                        : 'bg-black/20 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {info.icon}
                </button>
              );
            })}
          </div>

          {/* Look up/down + turns — secondary row */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
            {(['look_up', 'turn_left', 'turn_right', 'look_down'] as Action[]).map(action => {
              const clip = session?.clips[action];
              const available = clip?.status === 'ready';
              const info = ACTION_LABELS[action];
              return available ? (
                <button
                  key={action}
                  onClick={() => navigate(action)}
                  title={info.label}
                  className="w-8 h-8 rounded-lg bg-black/60 text-white text-xs font-bold hover:bg-black/80 backdrop-blur-sm transition-all"
                >
                  {info.icon}
                </button>
              ) : null;
            })}
          </div>

          {/* Current action label */}
          {currentAction && (
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
              <p className="text-xs text-white font-medium">{ACTION_LABELS[currentAction].label}</p>
            </div>
          )}

          {/* Model + disclaimer */}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
            <p className="text-xs text-slate-300">
              {currentAction && session?.clips[currentAction]?.model
                ? session.clips[currentAction].model!.split('/').pop()
                : 'StelarGenie'}
            </p>
          </div>
        </div>
      )}

      {/* Partial: show which directions are still generating */}
      {sessionStatus === 'partial' && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
          <p className="text-xs text-indigo-700">
            {readyClips}/{totalClips} directions ready — remaining clips still generating.
          </p>
        </div>
      )}

      {/* Idle: source image preview */}
      {sessionStatus === 'idle' && (
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={`data:image/jpeg;base64,${sourceImageB64}`}
            alt="Source scene"
            className="w-full aspect-video object-cover opacity-60"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm font-medium text-slate-700 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2">
              Click "Generate World" to make this scene navigable
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Keyboard hint */}
      {(sessionStatus === 'ready' || sessionStatus === 'partial') && (
        <p className="text-xs text-center text-slate-400">
          Arrow keys to navigate · Q/E to turn · Page Up/Down to look
        </p>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-300 leading-tight">
        AI-generated navigable environment — not a verified source. Generated by StelarGenie using OpenRouter video models.
      </p>
    </div>
  );
}
