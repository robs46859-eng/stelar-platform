import { useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import type { Corridor } from '../types.ts';

const MOCK: Corridor[] = [
  { id: '1', name: 'E Cesar Chavez St', neighborhoodId: '1', neighborhoodName: 'East Side', type: 'mixed-use', businessCount: 42, avgFootTraffic: 1850, vacancyRate: 8, score: 82 },
  { id: '2', name: 'S Congress Ave', neighborhoodId: '2', neighborhoodName: 'Bouldin Creek', type: 'commercial', businessCount: 68, avgFootTraffic: 3200, vacancyRate: 5, score: 91 },
  { id: '3', name: 'Airport Blvd', neighborhoodId: '3', neighborhoodName: 'Mueller', type: 'transit', businessCount: 29, avgFootTraffic: 2100, vacancyRate: 12, score: 74 },
  { id: '4', name: 'N Loop Blvd', neighborhoodId: '4', neighborhoodName: 'North Loop', type: 'commercial', businessCount: 35, avgFootTraffic: 1400, vacancyRate: 15, score: 65 },
  { id: '5', name: 'Cherrywood Rd', neighborhoodId: '5', neighborhoodName: 'Cherrywood', type: 'residential', businessCount: 18, avgFootTraffic: 920, vacancyRate: 4, score: 77 },
];

const typeColor: Record<Corridor['type'], string> = {
  commercial: 'bg-blue-100 text-blue-800',
  'mixed-use': 'bg-purple-100 text-purple-800',
  residential: 'bg-green-100 text-green-800',
  transit: 'bg-orange-100 text-orange-800',
};

function ScorePill({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-800' : score >= 65 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>{score}</span>;
}

export default function CorridorsPage() {
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Corridor[]>('/api/corridors')
      .then(setCorridors)
      .catch(() => {
        setError('Using demo data — API unavailable.');
        setCorridors(MOCK);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Corridors</h1>
      <p className="text-slate-500 text-sm mb-6">{corridors.length} corridors indexed</p>

      {error && (
        <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm py-12 text-center">Loading corridors…</div>
      ) : (
        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Corridor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Neighborhood</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Businesses</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Foot Traffic</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vacancy</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
              </tr>
            </thead>
            <tbody>
              {corridors.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.neighborhoodName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${typeColor[c.type]}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{c.businessCount}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{c.avgFootTraffic.toLocaleString()}/day</td>
                  <td className="px-4 py-3 text-right text-slate-600">{c.vacancyRate}%</td>
                  <td className="px-4 py-3 text-right"><ScorePill score={c.score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
