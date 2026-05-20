import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard.tsx';
import { api } from '../lib/api.ts';
import type { DashboardSummary } from '../types.ts';

const MOCK: DashboardSummary = {
  totalProperties: 12,
  totalUnits: 148,
  occupiedUnits: 131,
  pendingApplications: 7,
  activeTenants: 131,
  monthlyRevenue: 187400,
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardSummary>('/api/dashboard/summary')
      .then(setSummary)
      .catch(() => {
        setError('Could not load live data — showing demo values.');
        setSummary(MOCK);
      });
  }, []);

  const s = summary ?? MOCK;
  const occupancy = s.totalUnits > 0 ? Math.round((s.occupiedUnits / s.totalUnits) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-6 text-sm">Portfolio overview</p>

      {error && (
        <div className="mb-5 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Properties" value={s.totalProperties} />
        <StatCard label="Total Units" value={s.totalUnits} />
        <StatCard label="Occupancy" value={`${occupancy}%`} sub={`${s.occupiedUnits} / ${s.totalUnits} units`} />
        <StatCard label="Pending Applications" value={s.pendingApplications} />
        <StatCard label="Active Tenants" value={s.activeTenants} />
        <StatCard
          label="Monthly Revenue"
          value={`$${s.monthlyRevenue.toLocaleString()}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/properties"
          className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <p className="font-semibold text-slate-700">Manage Properties</p>
          <p className="text-sm text-slate-400 mt-1">View and edit property listings</p>
        </Link>
        <Link
          to="/screening"
          className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <p className="font-semibold text-slate-700">Screening Queue</p>
          <p className="text-sm text-slate-400 mt-1">{s.pendingApplications} applicants awaiting review</p>
        </Link>
        <Link
          to="/tenants"
          className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <p className="font-semibold text-slate-700">Tenant CRM</p>
          <p className="text-sm text-slate-400 mt-1">Contact info and lease details</p>
        </Link>
      </div>
    </div>
  );
}
