import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ScoreBar from '../components/ScoreBar.tsx';
import { api } from '../lib/api.ts';
import type { Neighborhood } from '../types.ts';

const MOCK_MAP: Record<string, Neighborhood> = {
  '1': { id: '1', name: 'East Side', city: 'Austin', state: 'TX', walkScore: 78, transitScore: 62, bikeScore: 71, safetyIndex: 74, medianRent: 1850, corridorCount: 8, population: 12400 },
  '2': { id: '2', name: 'Bouldin Creek', city: 'Austin', state: 'TX', walkScore: 85, transitScore: 55, bikeScore: 88, safetyIndex: 81, medianRent: 2200, corridorCount: 12, population: 8900 },
  '3': { id: '3', name: 'Mueller', city: 'Austin', state: 'TX', walkScore: 72, transitScore: 58, bikeScore: 76, safetyIndex: 88, medianRent: 2050, corridorCount: 6, population: 7200 },
  '4': { id: '4', name: 'North Loop', city: 'Austin', state: 'TX', walkScore: 66, transitScore: 49, bikeScore: 64, safetyIndex: 69, medianRent: 1600, corridorCount: 5, population: 9800 },
  '5': { id: '5', name: 'Cherrywood', city: 'Austin', state: 'TX', walkScore: 80, transitScore: 61, bikeScore: 82, safetyIndex: 78, medianRent: 1950, corridorCount: 7, population: 6500 },
};

export default function NeighborhoodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<Neighborhood>(`/api/neighborhoods/${id}`)
      .then(setNeighborhood)
      .catch(() => {
        const mock = MOCK_MAP[id];
        if (mock) {
          setError('Using demo data — API unavailable.');
          setNeighborhood(mock);
        } else {
          setError('Neighborhood not found.');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-slate-400 text-sm py-12 text-center">Loading…</div>;
  }

  if (!neighborhood) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-red-600">{error ?? 'Neighborhood not found.'}</p>
        <Link to="/neighborhoods" className="text-emerald-700 text-sm hover:underline mt-4 inline-block">
          Back to Neighborhoods
        </Link>
      </div>
    );
  }

  const n = neighborhood;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link to="/neighborhoods" className="text-emerald-700 text-sm hover:underline mb-4 inline-block">
        ← Back to Neighborhoods
      </Link>

      {error && (
        <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{n.name}</h1>
          <p className="text-slate-500 text-sm">{n.city}, {n.state}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            to={`/neighborhoods/${id}/tour`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <span>Tour This Neighborhood</span>
            <span aria-hidden>→</span>
          </Link>
          <div className="text-right text-sm text-slate-500">
            <p>Population: <span className="font-semibold text-slate-700">{n.population.toLocaleString()}</span></p>
            <p>Corridors: <span className="font-semibold text-slate-700">{n.corridorCount}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-emerald-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-600 mb-4">Mobility Scores</h2>
          <div className="flex flex-col gap-3">
            <ScoreBar label="Walk Score" value={n.walkScore} color="bg-emerald-500" />
            <ScoreBar label="Transit Score" value={n.transitScore} color="bg-blue-400" />
            <ScoreBar label="Bike Score" value={n.bikeScore} color="bg-teal-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-emerald-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-600 mb-4">Quality Metrics</h2>
          <div className="flex flex-col gap-3">
            <ScoreBar label="Safety Index" value={n.safetyIndex} color="bg-purple-400" />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Median Rent</p>
            <p className="text-2xl font-bold text-slate-800">${n.medianRent.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
