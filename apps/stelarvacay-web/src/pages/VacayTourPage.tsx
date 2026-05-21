import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchRoutePreview, fetchNeighborhoodTour } from '../lib/api.ts';
import { loadGoogleMaps } from '../lib/mapsLoader.ts';

type TourMode = 'neighborhood' | 'route' | 'compare';

interface RouteStep {
  step: number;
  instruction: string;
  mode: string;
  street_view_lat: number | null;
  street_view_lon: number | null;
  heading_deg: number | null;
  duration_min: number;
  cost_usd: number | null;
  tip: string | null;
}

interface RouteNarrative {
  tour_id: string;
  route_narrative: string;
  steps: RouteStep[];
  total_estimated_minutes: number;
  cost_estimate_usd: number | null;
  safety_notes: string;
  local_tips: string[];
  disclaimer: string;
}

interface NeighborhoodTour {
  meta: { neighborhood: string; city: string; disclaimer: string };
  arrival: { arrival_vibe: string; first_impression: string };
  safety: { overall_grade: string; overall_score: number; perceived_safety_notes: string };
  amenities: { food_and_drink: { coffee_shops: unknown[]; restaurants: unknown[] } };
  atmosphere: { tagline: string; why_people_love_it: string[]; is_ai_generated_label: string };
}

function ModeIcon({ mode }: { mode: string }) {
  const icons: Record<string, string> = { walk: '🚶', transit: '🚌', drive: '🚗', bike: '🚲', taxi: '🚕' };
  return <span>{icons[mode] ?? '📍'}</span>;
}

function StreetViewEmbed({ lat, lon, heading }: { lat: number; lon: number; heading: number | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'no_coverage'>('loading');

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const sv = new google.maps.StreetViewService();
        sv.getPanorama(
          { location: { lat, lng: lon }, radius: 80, source: google.maps.StreetViewSource.OUTDOOR },
          (data, status) => {
            if (cancelled) return;
            if (status !== google.maps.StreetViewStatus.OK || !containerRef.current) {
              setState('no_coverage');
              return;
            }
            new google.maps.StreetViewPanorama(containerRef.current, {
              pano: data!.location!.pano,
              pov: { heading: heading ?? 0, pitch: 0 },
              zoom: 0,
              fullscreenControl: false,
              linksControl: true,
              panControl: true,
              enableCloseButton: false,
              addressControl: false,
            });
            setState('ready');
          },
        );
      })
      .catch(() => setState('no_coverage'));
    return () => { cancelled = true; };
  }, [lat, lon, heading]);

  return (
    <div className="relative w-full h-52 rounded-xl overflow-hidden bg-slate-800">
      <div ref={containerRef} className="w-full h-full" />
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {state === 'no_coverage' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-slate-400 text-sm">No Street View at this point</p>
        </div>
      )}
    </div>
  );
}

export default function VacayTourPage() {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') as TourMode) ?? 'neighborhood';
  const destinationName = searchParams.get('dest') ?? '';
  const city = searchParams.get('city') ?? '';
  const state = searchParams.get('state') ?? '';
  const fromAddress = searchParams.get('from') ?? '';
  const toAddress = searchParams.get('to') ?? '';
  const lat = parseFloat(searchParams.get('lat') ?? '0') || null;
  const lon = parseFloat(searchParams.get('lon') ?? '0') || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [neighborhoodTour, setNeighborhoodTour] = useState<NeighborhoodTour | null>(null);
  const [routeNarrative, setRouteNarrative] = useState<RouteNarrative | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');

    if (mode === 'neighborhood') {
      fetchNeighborhoodTour({ neighborhood: destinationName, city, state, lat, lon })
        .then((data) => setNeighborhoodTour(data as NeighborhoodTour))
        .catch((err) => setError(String(err)))
        .finally(() => setLoading(false));
    } else if (mode === 'route') {
      fetchRoutePreview({ from_address: fromAddress, to_address: toAddress })
        .then((data) => setRouteNarrative(data as RouteNarrative))
        .catch((err) => setError(String(err)))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [mode, destinationName, city, state, fromAddress, toAddress, lat, lon]);

  const activeStep = routeNarrative?.steps[activeStepIdx];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">← Back</Link>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">
              {mode === 'neighborhood' ? `🌆 Neighborhood Walk — ${destinationName}` : `🗺 Route Preview`}
            </p>
            {(city || state) && (
              <p className="text-xs text-slate-400">{[city, state].filter(Boolean).join(', ')}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              to={`?mode=neighborhood&dest=${encodeURIComponent(destinationName)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`}
              className={`text-xs px-2 py-1 rounded transition-colors ${mode === 'neighborhood' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Neighborhood
            </Link>
            <Link
              to={`?mode=route&from=${encodeURIComponent(fromAddress)}&to=${encodeURIComponent(toAddress)}`}
              className={`text-xs px-2 py-1 rounded transition-colors ${mode === 'route' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Route
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {mode === 'neighborhood' ? 'Gemma 4 is building your neighborhood walk…' : 'Building route preview…'}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-xl px-5 py-4 mb-6">
            {error}
          </div>
        )}

        {/* Neighborhood walk */}
        {mode === 'neighborhood' && neighborhoodTour && !loading && (
          <div className="space-y-5">
            {/* Vibe header */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-lg font-bold text-white">{neighborhoodTour.atmosphere.tagline}</h2>
                <span className={`shrink-0 text-sm font-bold px-2 py-0.5 rounded ${
                  neighborhoodTour.safety.overall_score >= 70 ? 'bg-emerald-900 text-emerald-300' :
                  neighborhoodTour.safety.overall_score >= 40 ? 'bg-amber-900 text-amber-300' :
                  'bg-red-900 text-red-300'
                }`}>
                  Safety {neighborhoodTour.safety.overall_grade}
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-3">{neighborhoodTour.arrival.first_impression}</p>
              <p className="text-slate-400 text-sm">{neighborhoodTour.arrival.arrival_vibe}</p>
            </div>

            {/* Street View at destination coords */}
            {lat && lon && (
              <div>
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Street View — {destinationName}</p>
                <StreetViewEmbed lat={lat} lon={lon} heading={null} />
              </div>
            )}

            {/* Safety */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wide">Safety for Travelers</h3>
              <p className="text-sm text-slate-300">{neighborhoodTour.safety.perceived_safety_notes}</p>
            </div>

            {/* Why people love it */}
            {neighborhoodTour.atmosphere.why_people_love_it.length > 0 && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wide">Why Travelers Love It</h3>
                <ul className="space-y-1.5">
                  {neighborhoodTour.atmosphere.why_people_love_it.map((reason, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0">✓</span>{reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI label */}
            <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-400">{neighborhoodTour.atmosphere.is_ai_generated_label}</p>
              <p className="text-xs text-amber-500/70 mt-0.5">{neighborhoodTour.meta.disclaimer}</p>
            </div>
          </div>
        )}

        {/* Route preview */}
        {mode === 'route' && routeNarrative && !loading && (
          <div className="space-y-5">
            {/* Route summary */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <p className="text-slate-300 text-sm mb-3">{routeNarrative.route_narrative}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-slate-900/50 rounded-lg py-2.5">
                  <p className="text-lg font-bold text-white">{routeNarrative.total_estimated_minutes}m</p>
                  <p className="text-xs text-slate-400">Total time</p>
                </div>
                <div className="text-center bg-slate-900/50 rounded-lg py-2.5">
                  <p className="text-lg font-bold text-white">
                    {routeNarrative.cost_estimate_usd != null ? `$${routeNarrative.cost_estimate_usd.toFixed(2)}` : '—'}
                  </p>
                  <p className="text-xs text-slate-400">Estimated cost</p>
                </div>
                <div className="text-center bg-slate-900/50 rounded-lg py-2.5">
                  <p className="text-lg font-bold text-white">{routeNarrative.steps.length}</p>
                  <p className="text-xs text-slate-400">Steps</p>
                </div>
              </div>
            </div>

            {/* Active step Street View */}
            {activeStep?.street_view_lat && activeStep.street_view_lon && (
              <StreetViewEmbed
                lat={activeStep.street_view_lat}
                lon={activeStep.street_view_lon}
                heading={activeStep.heading_deg}
              />
            )}

            {/* Step navigator */}
            <div className="space-y-2">
              {routeNarrative.steps.map((step, i) => (
                <button
                  key={step.step}
                  onClick={() => setActiveStepIdx(i)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    i === activeStepIdx
                      ? 'border-emerald-500 bg-emerald-900/20'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      i === activeStepIdx ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {step.step}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <ModeIcon mode={step.mode} />
                        <span className="text-xs text-slate-400 capitalize">{step.mode}</span>
                        <span className="text-xs text-slate-500">· {step.duration_min}min</span>
                        {step.cost_usd != null && <span className="text-xs text-slate-500">· ${step.cost_usd.toFixed(2)}</span>}
                      </div>
                      <p className="text-sm text-slate-200">{step.instruction}</p>
                      {step.tip && <p className="text-xs text-emerald-400 mt-0.5 italic">{step.tip}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Safety notes */}
            {routeNarrative.safety_notes && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Safety Notes</h4>
                <p className="text-sm text-slate-300">{routeNarrative.safety_notes}</p>
              </div>
            )}

            {/* Local tips */}
            {routeNarrative.local_tips.length > 0 && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Local Tips</h4>
                <ul className="space-y-1">
                  {routeNarrative.local_tips.map((tip, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0">💡</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-slate-500 text-center">{routeNarrative.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
