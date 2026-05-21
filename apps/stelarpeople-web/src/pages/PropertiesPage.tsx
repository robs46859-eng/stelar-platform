import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge.tsx';
import { api } from '../lib/api.ts';
import type { Property } from '../types.ts';

const MOCK: Property[] = [
  { id: '1', name: 'Riverside Lofts', address: '100 River Rd, Austin TX', units: 24, occupiedUnits: 22, status: 'occupied', monthlyRevenue: 32000 },
  { id: '2', name: 'Maple Court', address: '55 Maple Ave, Austin TX', units: 12, occupiedUnits: 10, status: 'occupied', monthlyRevenue: 14500 },
  { id: '3', name: 'Sunset Terrace', address: '200 Sunset Blvd, Austin TX', units: 8, occupiedUnits: 0, status: 'vacant', monthlyRevenue: 0 },
  { id: '4', name: 'Cedar Ridge', address: '310 Cedar St, Austin TX', units: 16, occupiedUnits: 14, status: 'listed', monthlyRevenue: 21000 },
  { id: '5', name: 'Oak Commons', address: '75 Oak Ln, Austin TX', units: 20, occupiedUnits: 18, status: 'maintenance', monthlyRevenue: 27000 },
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Property[]>('/api/properties')
      .then(setProperties)
      .catch(() => {
        setError('Using demo data — API unavailable.');
        setProperties(MOCK);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Properties</h1>
          <p className="text-slate-500 text-sm mt-0.5">{properties.length} properties in portfolio</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm py-12 text-center">Loading properties…</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Property</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Units</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Occupancy</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue/mo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.address}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{p.units}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {p.units > 0 ? `${Math.round((p.occupiedUnits / p.units) * 100)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {p.monthlyRevenue > 0 ? `$${p.monthlyRevenue.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/properties/${p.id}/tour`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                    >
                      🗺 Preview Unit Area
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
