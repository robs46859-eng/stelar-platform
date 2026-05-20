import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.ts';
import type { Neighborhood } from '../types.ts';

const MOCK: Neighborhood[] = [
  { id: '1', name: 'East Side', city: 'Austin', state: 'TX', walkScore: 78, transitScore: 62, bikeScore: 71, safetyIndex: 74, medianRent: 1850, corridorCount: 8, population: 12400 },
  { id: '2', name: 'Bouldin Creek', city: 'Austin', state: 'TX', walkScore: 85, transitScore: 55, bikeScore: 88, safetyIndex: 81, medianRent: 2200, corridorCount: 12, population: 8900 },
  { id: '3', name: 'Mueller', city: 'Austin', state: 'TX', walkScore: 72, transitScore: 58, bikeScore: 76, safetyIndex: 88, medianRent: 2050, corridorCount: 6, population: 7200 },
  { id: '4', name: 'North Loop', city: 'Austin', state: 'TX', walkScore: 66, transitScore: 49, bikeScore: 64, safetyIndex: 69, medianRent: 1600, corridorCount: 5, population: 9800 },
  { id: '5', name: 'Cherrywood', city: 'Austin', state: 'TX', walkScore: 80, transitScore: 61, bikeScore: 82, safetyIndex: 78, medianRent: 1950, corridorCount: 7, population: 6500 },
];

function scoreColor(v: number) {
  if (v >= 80) return 'text-emerald-600';
  if (v >= 60) return 'text-yellow-600';
  return 'text-red-500';
}

export default function NeighborhoodsPage() {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Neighborhood[]>('/api/neighborhoods')
      .then(setNeighborhoods)
      .catch(() => {
        setError('Using demo data — API unavailable.');
        setNeighborhoods(MOCK);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Neighborhoods</h1>
      <p className="text-slate-500 text-sm mb-6">{neighborhoods.length} neighborhoods indexed</p>

      {error && (
        <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm py-12 text-center">Loading neighborhoods…</div>
      ) : (
        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Neighborhood</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Walk</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Transit</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bike</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Safety</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Median Rent</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Corridors</th>
              </tr>
            </thead>
            <tbody>
              {neighborhoods.map((n) => (
                <tr key={n.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/neighborhoods/${n.id}`} className="font-medium text-emerald-700 hover:underline">
                      {n.name}
                    </Link>
                    <p className="text-xs text-slate-400">{n.city}, {n.state}</p>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${scoreColor(n.walkScore)}`}>{n.walkScore}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${scoreColor(n.transitScore)}`}>{n.transitScore}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${scoreColor(n.bikeScore)}`}>{n.bikeScore}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${scoreColor(n.safetyIndex)}`}>{n.safetyIndex}</td>
                  <td className="px-4 py-3 text-right text-slate-600">${n.medianRent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{n.corridorCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
