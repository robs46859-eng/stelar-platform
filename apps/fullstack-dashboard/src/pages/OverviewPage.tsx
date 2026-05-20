import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DarkCard from '../components/DarkCard.tsx';
import StatusPill from '../components/StatusPill.tsx';
import { arkhamApi, gatewayApi } from '../lib/api.ts';
import type { ArkhamReviewItem, Agent, GatewayHealth, OverviewStats } from '../types.ts';

const MOCK: OverviewStats = {
  gatewayStatus: 'healthy',
  pendingReviews: 3,
  activeAgents: 5,
};

export default function OverviewPage() {
  const [stats, setStats] = useState<OverviewStats>(MOCK);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      gatewayApi.get<GatewayHealth>('/health'),
      arkhamApi.get<ArkhamReviewItem[]>('/reviews?status=pending'),
      gatewayApi.get<Agent[]>('/agents'),
    ])
      .then(([gw, reviews, agents]) => {
        setStats({
          gatewayStatus: gw.status,
          pendingReviews: reviews.length,
          activeAgents: agents.filter((a) => a.status === 'active').length,
        });
      })
      .catch(() => {
        setError('API unavailable — showing demo data.');
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Overview</h1>
      <p className="text-slate-400 text-sm mb-6">Operator control panel</p>

      {error && (
        <div className="mb-5 text-sm bg-yellow-900/40 border border-yellow-700 text-yellow-300 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <DarkCard>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Gateway</p>
          <StatusPill status={stats.gatewayStatus} />
          <p className="text-xs text-slate-500 mt-2">fullstack-gateway</p>
        </DarkCard>
        <DarkCard>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pending Reviews</p>
          <p className="text-3xl font-bold text-slate-100">{stats.pendingReviews}</p>
          <p className="text-xs text-slate-500 mt-1">Arkham governance queue</p>
        </DarkCard>
        <DarkCard>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Active Agents</p>
          <p className="text-3xl font-bold text-slate-100">{stats.activeAgents}</p>
          <p className="text-xs text-slate-500 mt-1">AiSquad workers running</p>
        </DarkCard>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/gateway', label: 'Gateway Health', desc: 'Request logs and provider status' },
          { to: '/governance', label: 'Governance', desc: 'Arkham review queue' },
          { to: '/agents', label: 'Agents', desc: 'AiSquad worker status' },
          { to: '/secrets', label: 'Secrets', desc: 'Key Vault secret health' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="block bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-500 hover:bg-slate-750 transition-all"
          >
            <p className="font-semibold text-slate-200 text-sm">{item.label}</p>
            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
