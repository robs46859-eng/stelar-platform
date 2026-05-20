import { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge.tsx';
import { api } from '../lib/api.ts';
import type { Applicant } from '../types.ts';

const MOCK: Applicant[] = [
  { id: '1', name: 'Jordan Lee', email: 'jordan@example.com', phone: '512-555-0101', propertyId: '1', propertyName: 'Riverside Lofts', appliedAt: '2025-05-15', creditScore: 710, income: 72000, status: 'pending' },
  { id: '2', name: 'Taylor Reyes', email: 'taylor@example.com', phone: '512-555-0202', propertyId: '4', propertyName: 'Cedar Ridge', appliedAt: '2025-05-16', creditScore: 680, income: 58000, status: 'pending' },
  { id: '3', name: 'Morgan Kim', email: 'morgan@example.com', phone: '512-555-0303', propertyId: '1', propertyName: 'Riverside Lofts', appliedAt: '2025-05-14', creditScore: 760, income: 95000, status: 'approved' },
  { id: '4', name: 'Casey Walsh', email: 'casey@example.com', phone: '512-555-0404', propertyId: '2', propertyName: 'Maple Court', appliedAt: '2025-05-13', creditScore: 600, income: 41000, status: 'denied' },
];

export default function ScreeningPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Applicant[]>('/api/screening')
      .then(setApplicants)
      .catch(() => {
        setError('Using demo data — API unavailable.');
        setApplicants(MOCK);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDecision = async (id: string, decision: 'approved' | 'denied') => {
    setActing(id);
    try {
      await api.post(`/api/screening/${id}/${decision}`, {});
      setApplicants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: decision } : a)),
      );
    } catch {
      setError('Action failed — could not reach API.');
    } finally {
      setActing(null);
    }
  };

  const pending = applicants.filter((a) => a.status === 'pending');
  const reviewed = applicants.filter((a) => a.status !== 'pending');

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Screening Queue</h1>
      <p className="text-slate-500 text-sm mb-6">{pending.length} applicants awaiting review</p>

      {error && (
        <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm py-12 text-center">Loading applicants…</div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Pending Review</h2>
              <div className="flex flex-col gap-3">
                {pending.map((a) => (
                  <ApplicantCard
                    key={a.id}
                    applicant={a}
                    acting={acting === a.id}
                    onDecision={handleDecision}
                  />
                ))}
              </div>
            </section>
          )}

          {reviewed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Recently Reviewed</h2>
              <div className="flex flex-col gap-3">
                {reviewed.map((a) => (
                  <ApplicantCard key={a.id} applicant={a} acting={false} onDecision={handleDecision} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ApplicantCard({
  applicant: a,
  acting,
  onDecision,
}: {
  applicant: Applicant;
  acting: boolean;
  onDecision: (id: string, d: 'approved' | 'denied') => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-slate-800">{a.name}</p>
            <StatusBadge status={a.status} />
          </div>
          <p className="text-sm text-slate-500">{a.email} &bull; {a.phone}</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Applying for: <span className="text-slate-700 font-medium">{a.propertyName}</span>
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>Credit Score: <span className="font-semibold text-slate-700">{a.creditScore}</span></p>
          <p>Income: <span className="font-semibold text-slate-700">${a.income.toLocaleString()}/yr</span></p>
          <p className="text-xs text-slate-400 mt-0.5">Applied {a.appliedAt}</p>
        </div>
      </div>
      {a.status === 'pending' && (
        <div className="flex gap-2 mt-4">
          <button
            disabled={acting}
            onClick={() => onDecision(a.id, 'approved')}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {acting ? 'Saving…' : 'Approve'}
          </button>
          <button
            disabled={acting}
            onClick={() => onDecision(a.id, 'denied')}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {acting ? 'Saving…' : 'Deny'}
          </button>
        </div>
      )}
    </div>
  );
}
