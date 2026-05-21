import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.ts';
import AerialViewPanel from '../components/tour/AerialViewPanel.tsx';
import GeniePreviewPanel from '../components/tour/GeniePreviewPanel.tsx';
import ImageUploadTour from '../components/tour/ImageUploadTour.tsx';
import StreetViewPanel from '../components/tour/StreetViewPanel.tsx';
import TourAgentOverlay, { type NarrationSegment } from '../components/tour/TourAgentOverlay.tsx';
import type { Property } from '../types.ts';

// Demo properties for when API is unavailable
const DEMO_PROPERTIES: Record<string, Property & { lat: number; lon: number }> = {
  '1': { id: '1', name: 'Riverside Lofts', address: '100 River Rd, Austin TX', units: 24, occupiedUnits: 22, status: 'occupied', monthlyRevenue: 32000, lat: 30.2672, lon: -97.7431 },
  '2': { id: '2', name: 'Maple Court', address: '55 Maple Ave, Austin TX', units: 12, occupiedUnits: 10, status: 'occupied', monthlyRevenue: 14500, lat: 30.2700, lon: -97.7500 },
  '3': { id: '3', name: 'Sunset Terrace', address: '200 Sunset Blvd, Austin TX', units: 8, occupiedUnits: 0, status: 'vacant', monthlyRevenue: 0, lat: 30.2600, lon: -97.7550 },
};

interface NarrationScript {
  route_to_door: { text: string; heading_deg: number | null; duration_sec: number };
  parking: { text: string; heading_deg: number | null; duration_sec: number };
  transit_access: { text: string; heading_deg: number | null; duration_sec: number };
  exterior_condition: { text: string; heading_deg: number | null; duration_sec: number; inspection_prompts?: string[] };
  entry_points: { text: string; heading_deg: number | null; duration_sec: number };
  neighborhood_pulse: { text: string; heading_deg: number | null; duration_sec: number };
  fraud_check: { text: string; heading_deg: number | null; duration_sec: number; severity?: string; flags?: string[] };
}

interface TourSession {
  session_id: string;
  narration: {
    script: NarrationScript;
    commute_preview: {
      to_downtown: { walk_min: number | null; drive_min: number | null; transit_min: number | null };
      commentary: string;
    };
    safety_summary: { grade: string; score: number; day_notes: string; night_notes: string; women_notes: string };
    what_to_inspect_in_person: Array<{ item: string; why: string; priority: string; applies_to: string }>;
    disclaimer: string;
  } | null;
  error?: string;
}

type ViewMode = 'street' | 'aerial';

function scriptToSegments(script: NarrationScript): NarrationSegment[] {
  const ICON_MAP: Record<string, string> = {
    route_to_door: '🏠', parking: '🚗', transit_access: '🚌',
    exterior_condition: '🔍', entry_points: '🚪', neighborhood_pulse: '🌆', fraud_check: '⚠',
  };
  const LABEL_MAP: Record<string, string> = {
    route_to_door: 'Route to Door', parking: 'Parking', transit_access: 'Transit',
    exterior_condition: 'Exterior', entry_points: 'Entry', neighborhood_pulse: 'Neighborhood', fraud_check: 'Fraud Check',
  };
  return Object.entries(script).map(([key, seg]) => ({
    key,
    icon: ICON_MAP[key] ?? '📍',
    label: LABEL_MAP[key] ?? key,
    text: seg.text,
    heading_deg: seg.heading_deg,
    duration_sec: seg.duration_sec ?? 30,
    severity: (seg as { severity?: string }).severity,
    flags: (seg as { flags?: string[] }).flags,
    inspection_prompts: (seg as { inspection_prompts?: string[] }).inspection_prompts,
  }));
}

function gradeColor(grade: string): string {
  if (grade === 'A' || grade === 'B') return 'text-emerald-700 bg-emerald-50';
  if (grade === 'C') return 'text-amber-700 bg-amber-50';
  return 'text-red-700 bg-red-50';
}

function priorityColor(priority: string): string {
  if (priority === 'critical') return 'bg-red-100 text-red-700';
  if (priority === 'high') return 'bg-orange-100 text-orange-700';
  if (priority === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export default function PropertyTourPage() {
  const { id } = useParams<{ id: string }>();
  const property = DEMO_PROPERTIES[id ?? '1'] ?? DEMO_PROPERTIES['1'];

  const [session, setSession] = useState<TourSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('street');
  const [activeHeading, setActiveHeading] = useState(0);
  const [noPanorama, setNoPanorama] = useState(false);
  const [uploadedImageB64, setUploadedImageB64] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tour' | 'checklist' | 'genie'>('tour');

  useEffect(() => {
    let cancelled = false;
    api
      .post<TourSession>(`/api/properties/${id}/tour/session`, {
        address: property.address,
        lat: property.lat,
        lon: property.lon,
        listing_facts: {
          name: property.name,
          units: property.units,
          status: property.status,
          monthly_revenue: property.monthlyRevenue,
        },
      })
      .then((res) => { if (!cancelled) setSession(res); })
      .catch(() => {
        if (!cancelled) setSession({ session_id: 'demo', narration: null, error: 'Tour narration unavailable — Gateway offline.' });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, property]);

  const segments = session?.narration?.script ? scriptToSegments(session.narration.script) : [];
  const narration = session?.narration;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/properties" className="text-slate-400 hover:text-slate-600 transition-colors text-sm">← Properties</Link>
            <span className="text-slate-200">/</span>
            <span className="text-slate-800 font-semibold">{property.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setViewMode('street'); setNoPanorama(false); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'street' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Street View
            </button>
            <button
              onClick={() => setViewMode('aerial')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'aerial' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Aerial 3D
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main map panel — takes 3/5 on desktop */}
          <div className="lg:col-span-3 space-y-4">
            <div className="h-[420px] rounded-xl overflow-hidden shadow-sm">
              {viewMode === 'street' && !noPanorama ? (
                <StreetViewPanel
                  lat={property.lat}
                  lon={property.lon}
                  initialHeading={activeHeading}
                  onHeadingChange={setActiveHeading}
                  onNoPanorama={() => setNoPanorama(true)}
                />
              ) : (
                <AerialViewPanel
                  lat={property.lat}
                  lon={property.lon}
                  label={property.name}
                />
              )}
            </div>

            {noPanorama && viewMode === 'street' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
                No Street View coverage at this address. Showing aerial view.
              </div>
            )}

            {/* Address + quick facts */}
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
              <p className="font-semibold text-slate-800 mb-0.5">{property.name}</p>
              <p className="text-sm text-slate-500 mb-3">{property.address}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">{property.units}</p>
                  <p className="text-xs text-slate-400">Units</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">
                    {property.units > 0 ? `${Math.round((property.occupiedUnits / property.units) * 100)}%` : '—'}
                  </p>
                  <p className="text-xs text-slate-400">Occupied</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">
                    {property.monthlyRevenue > 0 ? `$${(property.monthlyRevenue / 1000).toFixed(0)}k` : '—'}
                  </p>
                  <p className="text-xs text-slate-400">Revenue/mo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel — 2/5 */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab nav */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              {([['tour', '🗺 Tour'], ['checklist', '✓ Checklist'], ['genie', '⚡ Genie']] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tour tab */}
            {activeTab === 'tour' && (
              <div className="space-y-4">
                {loading && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                    <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Gemma 4 is generating your tour narration…</p>
                  </div>
                )}

                {session?.error && !narration && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
                    {session.error}
                  </div>
                )}

                {segments.length > 0 && (
                  <div className="bg-slate-800 rounded-xl overflow-hidden" style={{ minHeight: 280 }}>
                    <TourAgentOverlay
                      segments={segments}
                      currentHeading={activeHeading}
                      onRequestHeading={setActiveHeading}
                    />
                  </div>
                )}

                {/* Commute preview */}
                {narration?.commute_preview && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Commute to Downtown</h4>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {(['walk_min', 'drive_min', 'transit_min'] as const).map((k) => {
                        const val = narration.commute_preview.to_downtown[k];
                        const icon = k === 'walk_min' ? '🚶' : k === 'drive_min' ? '🚗' : '🚌';
                        return (
                          <div key={k} className="text-center bg-slate-50 rounded-lg py-2">
                            <p className="text-sm">{icon}</p>
                            <p className="text-base font-bold text-slate-800">{val != null ? `${val}m` : '—'}</p>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500">{narration.commute_preview.commentary}</p>
                  </div>
                )}

                {/* Safety summary */}
                {narration?.safety_summary && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Safety Summary</h4>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${gradeColor(narration.safety_summary.grade)}`}>
                        Grade {narration.safety_summary.grade}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full mb-3">
                      <div
                        className={`h-1.5 rounded-full ${narration.safety_summary.score >= 70 ? 'bg-emerald-500' : narration.safety_summary.score >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${narration.safety_summary.score}%` }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-600"><span className="font-medium">Day:</span> {narration.safety_summary.day_notes}</p>
                      <p className="text-xs text-slate-600"><span className="font-medium">Night:</span> {narration.safety_summary.night_notes}</p>
                    </div>
                  </div>
                )}

                {/* Photo upload for Gemini analysis */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <ImageUploadTour
                    tourId={session?.session_id ?? 'demo'}
                    listingFacts={{ name: property.name, address: property.address, units: property.units }}
                    onAnalysisComplete={(result) => {
                      // Store first exterior image for Genie transforms
                      const exterior = result.images.find((img) => img.detected_type.startsWith('exterior'));
                      if (exterior) {
                        setUploadedImageB64(null); // Will be set from the File directly in component
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Checklist tab */}
            {activeTab === 'checklist' && narration?.what_to_inspect_in_person && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">What to Inspect In Person</h3>
                <p className="text-xs text-slate-400">Generated by Gemma 4 based on property type and address.</p>
                <div className="space-y-2">
                  {narration.what_to_inspect_in_person.map((item, i) => (
                    <div key={i} className="rounded-lg border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-800">{item.item}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${priorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{item.why}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 text-center">{narration.disclaimer}</p>
              </div>
            )}

            {activeTab === 'checklist' && !narration?.what_to_inspect_in_person && (
              <div className="bg-slate-50 rounded-xl p-6 text-center">
                <p className="text-sm text-slate-400">
                  {loading ? 'Generating inspection checklist…' : 'Checklist unavailable — tour narration required.'}
                </p>
              </div>
            )}

            {/* Genie tab */}
            {activeTab === 'genie' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <GeniePreviewPanel
                  tourId={session?.session_id ?? 'demo'}
                  sourceImageB64={uploadedImageB64}
                />
                {!uploadedImageB64 && (
                  <p className="mt-3 text-xs text-slate-400 text-center">
                    Upload a photo on the Tour tab to enable Genie creative previews.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
