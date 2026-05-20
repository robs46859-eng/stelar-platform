import { useEffect, useState } from 'react';
import DarkCard from '../components/DarkCard.tsx';
import StatusPill from '../components/StatusPill.tsx';
import { arkhamApi } from '../lib/api.ts';
import type { ArkhamReviewItem } from '../types.ts';

const MOCK: ArkhamReviewItem[] = [
  { id: '1', type: 'prompt-injection', description: 'User prompt contained potential injection attempt in /chat endpoint', severity: 'high', createdAt: '2025-05-20T13:10:00Z', status: 'pending' },
  { id: '2', type: 'pii-exposure', description: 'Model response included what appears to be an email address', severity: 'medium', createdAt: '2025-05-20T12:45:00Z', status: 'pending' },
  { id: '3', type: 'policy-violation', description: 'Request exceeded content policy threshold on topic filter', severity: 'critical', createdAt: '2025-05-20T11:30:00Z', status: 'pending' },
  { id: '4', type: 'rate-abuse', description: 'Single API key sent 3x normal request volume in 5 minutes', severity: 'low', createdAt: '2025-05-19T22:00:00Z', status: 'approved' },
  { id: '5', type: 'data-leak', description: 'Possible system prompt extraction attempt detected', severity: 'critical', createdAt: '2025-05-19T18:00:00Z', status: 'rejected' },
];

export default function GovernancePage() {
  const [items, setItems] = useState<ArkhamReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    arkhamApi
      .get<ArkhamReviewItem[]>('/reviews')
      .then(setItems)
      .catch(() => {
        setError('API unavailable — showing demo data.');
        setItems(MOCK);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    setActing(id);
    try {
      await arkhamApi.post(`/reviews/${id}/${decision}`, {});
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: decision } : i)));
    } catch {
      setError('Action failed — could not reach Arkham API.');
    } finally {
      setActing(null);
    }
  };

  const pending = items.filter((i) => i.status === 'pending');
  const reviewed = items.filter((i) => i.status !== 'pending');

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Governance</h1>
      <p className="text-slate-400 text-sm mb-6">Arkham review queue — {pending.length} pending</p>

      {error && (
        <div className="mb-5 text-sm bg-yellow-900/40 border border-yellow-700 text-yellow-300 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm py-12 text-center">Loading reviews…</div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pending Review</h2>
              <div className="flex flex-col gap-3">
                {pending.map((item) => (
                  <ReviewCard key={item.id} item={item} acting={acting === item.id} onDecision={handleDecision} />
                ))}
              </div>
            </section>
          )}
          {reviewed.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Reviewed</h2>
              <div className="flex flex-col gap-3">
                {reviewed.map((item) => (
                  <ReviewCard key={item.id} item={item} acting={false} onDecision={handleDecision} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ReviewCard({
  item,
  acting,
  onDecision,
}: {
  item: ArkhamReviewItem;
  acting: boolean;
  onDecision: (id: string, d: 'approved' | 'rejected') => void;
}) {
  return (
    <DarkCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-medium text-slate-200 capitalize">{item.type.replace(/-/g, ' ')}</p>
            <StatusPill status={item.severity} />
            <StatusPill status={item.status} />
          </div>
          <p className="text-sm text-slate-400">{item.description}</p>
        </div>
        <p className="text-xs text-slate-500 shrink-0">{item.createdAt.replace('T', ' ').replace('Z', '')}</p>
      </div>
      {item.status === 'pending' && (
        <div className="flex gap-2 mt-4">
          <button
            disabled={acting}
            onClick={() => onDecision(item.id, 'approved')}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-green-700 text-green-100 hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {acting ? 'Saving…' : 'Approve'}
          </button>
          <button
            disabled={acting}
            onClick={() => onDecision(item.id, 'rejected')}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-800 text-red-100 hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {acting ? 'Saving…' : 'Reject'}
          </button>
        </div>
      )}
    </DarkCard>
  );
}
