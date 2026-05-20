import { useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import type { Tenant } from '../types.ts';

const MOCK: Tenant[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@example.com', phone: '512-555-1001', propertyId: '1', propertyName: 'Riverside Lofts', unit: '3B', leaseStart: '2024-03-01', leaseEnd: '2025-03-01', monthlyRent: 1800 },
  { id: '2', name: 'Jamie Martinez', email: 'jamie@example.com', phone: '512-555-1002', propertyId: '2', propertyName: 'Maple Court', unit: '1A', leaseStart: '2024-06-01', leaseEnd: '2025-06-01', monthlyRent: 1400 },
  { id: '3', name: 'Sam Patel', email: 'sam@example.com', phone: '512-555-1003', propertyId: '1', propertyName: 'Riverside Lofts', unit: '5C', leaseStart: '2023-09-01', leaseEnd: '2025-09-01', monthlyRent: 1950 },
  { id: '4', name: 'Riley Chen', email: 'riley@example.com', phone: '512-555-1004', propertyId: '4', propertyName: 'Cedar Ridge', unit: '2D', leaseStart: '2024-01-01', leaseEnd: '2026-01-01', monthlyRent: 1650 },
  { id: '5', name: 'Quinn Davis', email: 'quinn@example.com', phone: '512-555-1005', propertyId: '5', propertyName: 'Oak Commons', unit: '4F', leaseStart: '2024-08-01', leaseEnd: '2025-08-01', monthlyRent: 1550 },
];

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get<Tenant[]>('/api/tenants')
      .then(setTenants)
      .catch(() => {
        setError('Using demo data — API unavailable.');
        setTenants(MOCK);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.propertyName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tenants</h1>
          <p className="text-slate-500 text-sm mt-0.5">{tenants.length} active tenants</p>
        </div>
        <input
          type="search"
          placeholder="Search by name, email, or property…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-72"
        />
      </div>

      {error && (
        <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm py-12 text-center">Loading tenants…</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tenant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Property / Unit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Lease</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rent/mo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No tenants match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <p>{t.email}</p>
                      <p className="text-xs">{t.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.propertyName} &bull; Unit {t.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {t.leaseStart} — {t.leaseEnd}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      ${t.monthlyRent.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
