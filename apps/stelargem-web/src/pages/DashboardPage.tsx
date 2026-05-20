import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.ts';
import type { DashboardStats } from '../types.ts';

const MOCK: DashboardStats = {
  neighborhoodCount: 38,
  corridorCount: 124,
  avgWalkScore: 72,
  avgSafetyIndex: 68,
};

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-emerald-100 p-5 shadow-sm">
      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardStats>('/api/stats')
      .then(setStats)
      .catch(() => {
        setError('API unavailable — showing demo data.');
        setStats(MOCK);
      });
  }, []);

  const s = stats ?? MOCK;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Neighborhood Intelligence</h1>
      <p className="text-slate-500 text-sm mb-6">Local corridor data and neighborhood scoring</p>

      {error && (
        <div className="mb-5 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatTile label="Neighborhoods" value={s.neighborhoodCount} />
        <StatTile label="Corridors" value={s.corridorCount} />
        <StatTile label="Avg Walk Score" value={s.avgWalkScore} sub="out of 100" />
        <StatTile label="Avg Safety Index" value={s.avgSafetyIndex} sub="out of 100" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/neighborhoods"
          className="block bg-white rounded-xl border border-emerald-100 p-5 hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <p className="font-semibold text-slate-700">Neighborhoods</p>
          <p className="text-sm text-slate-400 mt-1">Browse {s.neighborhoodCount} scored neighborhoods</p>
        </Link>
        <Link
          to="/corridors"
          className="block bg-white rounded-xl border border-emerald-100 p-5 hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <p className="font-semibold text-slate-700">Corridors</p>
          <p className="text-sm text-slate-400 mt-1">Analyze {s.corridorCount} local corridors</p>
        </Link>
      </div>
    </div>
  );
}
