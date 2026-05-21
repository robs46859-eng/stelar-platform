import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.ts';
import { loadGoogleMaps } from '../lib/mapsLoader.ts';
import type { TourResponse, NearbyPlace, NearbyRestaurant, NearbySchool, SafetyMetric, Grade } from '../types/tour.ts';

// ─── helpers ────────────────────────────────────────────────────────────────

function gradeColor(grade: Grade | string): string {
  if (grade === 'A' || grade === 'B') return 'text-emerald-700 bg-emerald-50';
  if (grade === 'C') return 'text-amber-700 bg-amber-50';
  return 'text-red-700 bg-red-50';
}

function ftToStr(ft: number): string {
  return ft < 1000 ? `${ft} ft` : `${(ft / 5280).toFixed(1)} mi`;
}

function fmtUsd(n: number | null): string {
  if (n == null) return '—';
  return `$${n.toLocaleString()}`;
}

function Badge({ label, variant = 'neutral' }: { label: string; variant?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colors = {
    good: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
    bad: 'bg-red-50 text-red-700',
    neutral: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[variant]}`}>
      {label.replace(/_/g, ' ')}
    </span>
  );
}

function PlaceRow({ place }: { place: NearbyPlace }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{place.name}</p>
        {place.notable && <p className="text-xs text-slate-500">{place.notable}</p>}
      </div>
      <span className="text-xs text-slate-400 shrink-0 ml-3">{place.walk_minutes}m · {ftToStr(place.distance_ft)}</span>
    </div>
  );
}

function RestaurantRow({ place }: { place: NearbyRestaurant }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{place.name}</p>
        <p className="text-xs text-slate-500">{place.cuisine} · {place.price_range}</p>
      </div>
      <span className="text-xs text-slate-400 shrink-0 ml-3">{place.walk_minutes}m · {ftToStr(place.distance_ft)}</span>
    </div>
  );
}

function SchoolRow({ place }: { place: NearbySchool }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{place.name}</p>
        <p className="text-xs text-slate-500">{place.grades} · {place.type}</p>
      </div>
      <div className="text-right shrink-0 ml-3">
        {place.rating != null && <p className="text-xs font-semibold text-emerald-700">{place.rating}/10</p>}
        <p className="text-xs text-slate-400">{place.walk_minutes}m</p>
      </div>
    </div>
  );
}

function SafetyCard({ label, metric }: { label: string; metric: SafetyMetric }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${gradeColor(metric.grade)}`}>{metric.grade}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full mb-2">
        <div
          className={`h-1.5 rounded-full ${metric.score >= 70 ? 'bg-emerald-500' : metric.score >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
          style={{ width: `${metric.score}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{metric.notes}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{title}</h3>
      {children}
    </div>
  );
}

function AmenityGroup({ title, places }: { title: string; places: NearbyPlace[] }) {
  if (!places.length) return null;
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-slate-500 mb-1">{title}</p>
      {places.map((p, i) => <PlaceRow key={i} place={p} />)}
    </div>
  );
}

// ─── map panel ──────────────────────────────────────────────────────────────

type MapMode = 'street' | 'aerial';

function MapPanel({ neighborhood, city, state }: { neighborhood: string; city: string; state: string }) {
  const streetRef = useRef<HTMLDivElement>(null);
  const aerialRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<MapMode>('street');
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [svUnavailable, setSvUnavailable] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapsReady(true))
      .catch((e: Error) => setMapsError(e.message));
  }, []);

  useEffect(() => {
    if (!mapsReady) return;
    const query = `${neighborhood}, ${city}, ${state}`;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== 'OK' || !results?.length) {
        setMapsError(`Could not locate "${query}" on the map.`);
        return;
      }
      const loc = results[0].geometry.location;

      if (streetRef.current) {
        const svService = new google.maps.StreetViewService();
        svService.getPanorama({ location: loc, radius: 500 }, (data, svStatus) => {
          if (svStatus === 'OK' && data?.location?.latLng && streetRef.current) {
            new google.maps.StreetViewPanorama(streetRef.current, {
              position: data.location.latLng,
              pov: { heading: 0, pitch: 0 },
              zoom: 1,
              addressControl: false,
              showRoadLabels: true,
              motionTracking: false,
            });
          } else {
            setSvUnavailable(true);
          }
        });
      }

      if (aerialRef.current) {
        new google.maps.Map(aerialRef.current, {
          center: loc,
          zoom: 16,
          mapTypeId: 'satellite',
          tilt: 45,
          disableDefaultUI: true,
          zoomControl: true,
        });
      }
    });
  }, [mapsReady, neighborhood, city, state]);

  if (mapsError) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 text-slate-400 text-sm p-6 text-center">
        {mapsError}
      </div>
    );
  }

  if (!mapsReady) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 text-slate-400 text-sm">
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div
        ref={streetRef}
        className={`w-full h-full ${mode === 'street' ? 'block' : 'hidden'}`}
      >
        {svUnavailable && mode === 'street' && (
          <div className="flex items-center justify-center h-full bg-slate-100 text-slate-400 text-sm">
            Street View not available for this location
          </div>
        )}
      </div>
      <div ref={aerialRef} className={`w-full h-full ${mode === 'aerial' ? 'block' : 'hidden'}`} />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-white/90 rounded-full px-1 py-1 shadow">
        {(['street', 'aerial'] as MapMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              mode === m ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {m === 'street' ? 'Street View' : 'Aerial'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── tab definitions ─────────────────────────────────────────────────────────

type Tab =
  | 'overview'
  | 'navigation'
  | 'safety'
  | 'environment'
  | 'amenities'
  | 'real_estate'
  | 'community'
  | 'genie'
  | 'inspection'
  | 'fraud';

const BASE_TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'safety', label: 'Safety' },
  { id: 'environment', label: 'Environment' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'community', label: 'Community' },
  { id: 'genie', label: 'Genie 3' },
];

// ─── tab panels ──────────────────────────────────────────────────────────────

function OverviewPanel({ tour }: { tour: TourResponse }) {
  const { arrival, atmosphere } = tour;
  return (
    <div>
      <div className="bg-emerald-50 rounded-xl p-4 mb-5">
        <p className="text-lg font-semibold text-emerald-900">{atmosphere.tagline}</p>
        <p className="text-sm text-emerald-700 mt-1">{arrival.arrival_vibe}</p>
      </div>
      <Section title="First Impression">
        <p className="text-sm text-slate-700">{arrival.first_impression}</p>
      </Section>
      <Section title="Gateway Landmarks">
        <ul className="space-y-1">
          {arrival.gateway_landmarks.map((l, i) => (
            <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-emerald-500">›</span>{l}</li>
          ))}
        </ul>
      </Section>
      <Section title="Time of Day">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(arrival.time_of_day_notes).map(([period, note]) => (
            <div key={period} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 capitalize mb-1">{period.replace('_', ' ')}</p>
              <p className="text-xs text-slate-600">{note}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Approach Vectors">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(arrival.approach_vectors).map(([dir, note]) => (
            <div key={dir} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{dir.replace('from_', '')}</p>
              <p className="text-xs text-slate-600">{note}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Seasonality">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(arrival.seasonality).map(([season, note]) => (
            <div key={season} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 capitalize mb-1">{season}</p>
              <p className="text-xs text-slate-600">{note}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Atmosphere">
        <div className="space-y-3">
          {[
            { label: 'Morning', val: atmosphere.morning_character },
            { label: 'Daytime', val: atmosphere.daytime_character },
            { label: 'Evening', val: atmosphere.evening_character },
            { label: 'Late Night', val: atmosphere.late_night_character },
          ].map(({ label, val }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
              <p className="text-xs text-slate-600">{val}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Who Lives Here">
        <p className="text-sm text-slate-700 mb-2">{atmosphere.who_lives_here}</p>
        <p className="text-sm text-slate-500 italic">{atmosphere.who_visits_here}</p>
      </Section>
      {atmosphere.why_people_love_it.length > 0 && (
        <Section title="Why People Love It">
          <ul className="space-y-1">
            {atmosphere.why_people_love_it.map((r, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-emerald-500">✓</span>{r}</li>
            ))}
          </ul>
        </Section>
      )}
      {atmosphere.hidden_gems.length > 0 && (
        <Section title="Hidden Gems">
          <ul className="space-y-1">
            {atmosphere.hidden_gems.map((g, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-amber-500">★</span>{g}</li>
            ))}
          </ul>
        </Section>
      )}
      {atmosphere.local_insider_tips.length > 0 && (
        <Section title="Insider Tips">
          <ul className="space-y-1">
            {atmosphere.local_insider_tips.map((t, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-blue-500">→</span>{t}</li>
            ))}
          </ul>
        </Section>
      )}
      {atmosphere.common_complaints.length > 0 && (
        <Section title="Common Complaints">
          <ul className="space-y-1">
            {atmosphere.common_complaints.map((c, i) => (
              <li key={i} className="text-sm text-slate-500 flex gap-2"><span className="text-red-400">!</span>{c}</li>
            ))}
          </ul>
        </Section>
      )}
      {atmosphere.what_to_know_before_moving_in.length > 0 && (
        <Section title="Before You Move In">
          <ul className="space-y-1">
            {atmosphere.what_to_know_before_moving_in.map((n, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-slate-400">·</span>{n}</li>
            ))}
          </ul>
        </Section>
      )}
      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
        <p className="text-xs text-amber-700">{atmosphere.is_ai_generated_label}</p>
      </div>
    </div>
  );
}

function NavigationPanel({ tour }: { tour: TourResponse }) {
  const { navigation, mobility } = tour;
  return (
    <div>
      <Section title="Mobility Scores">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Walk', score: mobility.walk_score },
            { label: 'Transit', score: mobility.transit_score },
            { label: 'Bike', score: mobility.bike_score },
          ].map(({ label, score }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{score}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge label={mobility.car_dependency} variant={mobility.walk_score >= 70 ? 'good' : 'warn'} />
          <Badge label={`Traffic: ${mobility.rush_hour_traffic}`} />
          {mobility.scooter_share && <Badge label="Scooter Share" variant="good" />}
        </div>
        {mobility.mobility_barriers.length > 0 && (
          <div className="mt-2 bg-red-50 rounded-lg p-2">
            <p className="text-xs font-semibold text-red-600 mb-1">Mobility Barriers</p>
            <ul className="space-y-0.5">
              {mobility.mobility_barriers.map((b, i) => <li key={i} className="text-xs text-red-600">· {b}</li>)}
            </ul>
          </div>
        )}
      </Section>
      <Section title="Commute to Downtown">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(mobility.commute_to_downtown_minutes)
            .filter(([, v]) => v != null)
            .map(([tmode, mins]) => (
              <div key={tmode} className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-sm font-semibold text-slate-700">{mins} min</p>
                <p className="text-xs text-slate-400 capitalize">{tmode}</p>
              </div>
            ))}
        </div>
      </Section>
      <Section title="Getting Here">
        <p className="text-sm text-slate-700 mb-3">{navigation.walk_to_core}</p>
        <p className="text-xs font-semibold text-slate-500 mb-1">Main Pedestrian Routes</p>
        <ul className="space-y-1 mb-4">
          {navigation.main_pedestrian_routes.map((r, i) => (
            <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-emerald-500">›</span>{r}</li>
          ))}
        </ul>
        <p className="text-xs font-semibold text-slate-500 mb-1">Navigation Landmarks</p>
        <ul className="space-y-1">
          {navigation.navigation_landmarks.map((l, i) => (
            <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-blue-400">◎</span>{l}</li>
          ))}
        </ul>
      </Section>
      {navigation.transit_stops.length > 0 && (
        <Section title="Transit Stops">
          <div className="space-y-2">
            {navigation.transit_stops.map((stop, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-800">{stop.name}</p>
                  <Badge label={stop.type.replace('_', ' ')} variant="neutral" />
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {stop.lines.map((l) => (
                    <span key={l} className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">{l}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  {stop.walk_minutes}m walk · {ftToStr(stop.distance_ft)}
                  {stop.frequency_peak_min ? ` · Every ${stop.frequency_peak_min}m peak` : ''}
                  {stop.accessibility ? ' · Accessible' : ''}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
      {navigation.parking.length > 0 && (
        <Section title="Parking">
          <div className="space-y-2">
            {navigation.parking.map((p, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{p.name ?? p.zone_type.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-400">
                    {p.permit_required ? 'Permit required · ' : ''}{p.hourly_rate ? `$${p.hourly_rate}/hr · ` : ''}
                    {ftToStr(p.distance_ft)}
                  </p>
                </div>
                <Badge
                  label={p.availability}
                  variant={p.availability === 'abundant' ? 'good' : p.availability === 'moderate' ? 'warn' : 'bad'}
                />
              </div>
            ))}
          </div>
        </Section>
      )}
      <Section title="Bike">
        <div className="flex flex-wrap gap-1 mb-2">
          {navigation.bike_infrastructure.has_protected_lanes && <Badge label="Protected Lanes" variant="good" />}
          {navigation.bike_infrastructure.has_shared_lanes && <Badge label="Shared Lanes" variant="neutral" />}
          {navigation.bike_infrastructure.has_trail_access && <Badge label="Trail Access" variant="good" />}
        </div>
        <p className="text-sm text-slate-600 mb-2">{navigation.bike_infrastructure.notes}</p>
        {navigation.bike_infrastructure.bike_share_docks.map((d, i) => (
          <p key={i} className="text-xs text-slate-500">Bike Share: {d.name} — {ftToStr(d.distance_ft)}</p>
        ))}
      </Section>
      <Section title="Accessibility">
        <div className="flex flex-wrap gap-1 mb-2">
          {navigation.accessibility.wheelchair_accessible && <Badge label="Wheelchair Accessible" variant="good" />}
          {navigation.accessibility.elevator_access && <Badge label="Elevator Access" variant="good" />}
          <Badge label={`Curb Cuts: ${navigation.accessibility.curb_cut_quality}`} />
        </div>
        {navigation.accessibility.notes && <p className="text-sm text-slate-600">{navigation.accessibility.notes}</p>}
      </Section>
      <Section title="Ride Share">
        <div className="flex flex-wrap gap-2 items-center">
          {navigation.ride_share.typical_wait_minutes != null && (
            <span className="text-sm text-slate-600">Avg wait: <strong>{navigation.ride_share.typical_wait_minutes}m</strong></span>
          )}
          <Badge
            label={`Surge: ${navigation.ride_share.surge_likelihood}`}
            variant={navigation.ride_share.surge_likelihood === 'low' ? 'good' : navigation.ride_share.surge_likelihood === 'medium' ? 'warn' : 'bad'}
          />
        </div>
        {navigation.ride_share.pickup_zones.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {navigation.ride_share.pickup_zones.map((z, i) => <li key={i} className="text-xs text-slate-500">· {z}</li>)}
          </ul>
        )}
      </Section>
      <Section title="Distance to Key Hubs">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(navigation.distances_to_key_hubs)
            .filter(([, v]) => v != null)
            .map(([hub, mi]) => (
              <div key={hub} className="bg-slate-50 rounded-lg p-2">
                <p className="text-sm font-semibold text-slate-700">{mi} mi</p>
                <p className="text-xs text-slate-400 capitalize">{hub.replace(/_/g, ' ')}</p>
              </div>
            ))}
        </div>
      </Section>
    </div>
  );
}

function SafetyPanel({ tour }: { tour: TourResponse }) {
  const { safety } = tour;
  return (
    <div>
      <div className="bg-slate-50 rounded-xl p-4 mb-5 flex items-center gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-slate-800">{safety.overall_score}</p>
          <p className="text-xs text-slate-400">/ 100</p>
        </div>
        <div>
          <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${gradeColor(safety.overall_grade)}`}>
            {safety.overall_grade}
          </span>
          <p className="text-xs text-slate-500 mt-1">Overall Safety</p>
        </div>
        <div className="flex flex-col gap-1 ml-auto">
          <Badge label={safety.lighting_quality} variant={safety.lighting_quality === 'excellent' || safety.lighting_quality === 'good' ? 'good' : 'warn'} />
          <Badge label={`Foot traffic: ${safety.foot_traffic_density.replace('_', ' ')}`} />
          {safety.neighborhood_watch && <Badge label="Neighborhood Watch" variant="good" />}
        </div>
      </div>
      <Section title="Day vs Night">
        <div className="grid grid-cols-2 gap-3">
          <SafetyCard label="Day" metric={safety.day_safety} />
          <SafetyCard label="Night" metric={safety.night_safety} />
        </div>
      </Section>
      <Section title="Crime Profile">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <SafetyCard label="Property Crime" metric={safety.crime_profile.property_crime} />
          <SafetyCard label="Violent Crime" metric={safety.crime_profile.violent_crime} />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Badge
            label={`Trend: ${safety.crime_profile.trend}`}
            variant={safety.crime_profile.trend === 'improving' ? 'good' : safety.crime_profile.trend === 'worsening' ? 'bad' : 'neutral'}
          />
        </div>
        <p className="text-sm text-slate-600 mb-1">{safety.crime_profile.context}</p>
        <p className="text-xs text-slate-400">{safety.crime_profile.comparison_to_city_avg}</p>
      </Section>
      <Section title="Environmental Safety">
        <div className="flex flex-wrap gap-1 mb-3">
          {safety.environmental_safety.flood_zone && <Badge label="Flood Zone" variant="bad" />}
          <Badge label={`Fire Risk: ${safety.environmental_safety.fire_risk}`} variant={safety.environmental_safety.fire_risk === 'low' ? 'good' : safety.environmental_safety.fire_risk === 'high' ? 'bad' : 'warn'} />
          <Badge label={`Noise: ${safety.environmental_safety.noise_pollution}`} />
          {safety.environmental_safety.toxic_sites_nearby && <Badge label="Toxic Sites Nearby" variant="bad" />}
          {safety.environmental_safety.air_quality_index != null && (
            <Badge
              label={`AQI: ${safety.environmental_safety.air_quality_index}`}
              variant={safety.environmental_safety.air_quality_index < 50 ? 'good' : safety.environmental_safety.air_quality_index < 100 ? 'warn' : 'bad'}
            />
          )}
        </div>
        {safety.environmental_safety.notes && <p className="text-sm text-slate-600">{safety.environmental_safety.notes}</p>}
      </Section>
      <Section title="Specific Safety Notes">
        {[
          { label: 'General', note: safety.perceived_safety_notes },
          { label: 'Women', note: safety.women_safety_notes },
          { label: 'Children', note: safety.child_safety_notes },
        ].map(({ label, note }) => (
          <div key={label} className="mb-3 bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
            <p className="text-sm text-slate-600">{note}</p>
          </div>
        ))}
      </Section>
      {safety.emergency_services.length > 0 && (
        <Section title="Emergency Services">
          <div className="space-y-2">
            {safety.emergency_services.map((svc, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{svc.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{svc.type.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{svc.drive_minutes}m drive</p>
                  {svc.walk_minutes != null && <p className="text-xs text-slate-400">{svc.walk_minutes}m walk</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function EnvironmentPanel({ tour }: { tour: TourResponse }) {
  const { physical_environment: pe, architecture: arch } = tour;
  return (
    <div>
      <Section title="Street & Physical">
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge label={`Grid: ${pe.street_grid_type.replace('_', ' ')}`} />
          <Badge label={pe.topography.replace('_', ' ')} />
          <Badge label={`Roads: ${pe.road_condition}`} variant={pe.road_condition === 'excellent' || pe.road_condition === 'good' ? 'good' : 'warn'} />
          <Badge label={`Canopy: ${pe.tree_canopy}`} variant={pe.tree_canopy === 'dense' || pe.tree_canopy === 'moderate' ? 'good' : 'neutral'} />
          <Badge label={`Lighting: ${pe.street_lighting}`} variant={pe.street_lighting === 'excellent' || pe.street_lighting === 'good' ? 'good' : 'warn'} />
          <Badge label={`Seating: ${pe.public_seating}`} />
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { l: 'Sidewalks', v: pe.sidewalk_quality.continuity },
            { l: 'Condition', v: pe.sidewalk_quality.condition },
            { l: 'Width', v: pe.sidewalk_quality.width },
          ].map(({ l, v }) => (
            <div key={l} className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-xs font-semibold text-slate-700 capitalize">{v.replace('_', ' ')}</p>
              <p className="text-xs text-slate-400">{l}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Noise Profile">
        <div className="flex items-center gap-2 mb-2">
          <Badge
            label={pe.noise_profile.decibel_estimate}
            variant={pe.noise_profile.decibel_estimate === 'quiet' ? 'good' : pe.noise_profile.decibel_estimate === 'moderate' ? 'neutral' : 'bad'}
          />
        </div>
        <p className="text-xs text-slate-500 mb-1">Sources: {pe.noise_profile.primary_sources.join(', ')}</p>
        <p className="text-xs text-slate-500">Peak: {pe.noise_profile.peak_hours} · Quiet: {pe.noise_profile.quiet_hours}</p>
      </Section>
      <Section title="Weather Exposure">
        <div className="flex flex-wrap gap-1">
          {pe.weather_exposure.wind_corridor && <Badge label="Wind Corridor" variant="warn" />}
          {pe.weather_exposure.flood_prone && <Badge label="Flood Prone" variant="bad" />}
          <Badge label={`Shade: ${pe.weather_exposure.shade_coverage}`} variant={pe.weather_exposure.shade_coverage === 'excellent' || pe.weather_exposure.shade_coverage === 'good' ? 'good' : 'neutral'} />
          <Badge label={`Sun: ${pe.weather_exposure.solar_exposure}`} />
        </div>
      </Section>
      <Section title="Green Space">
        {pe.green_space.parks.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Parks</p>
            {pe.green_space.parks.map((p, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2 mb-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-slate-700">{p.name}</p>
                  <span className="text-xs text-slate-400">{ftToStr(p.distance_ft)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.features.slice(0, 4).map((f, j) => <Badge key={j} label={f} />)}
                  {p.dog_friendly && <Badge label="Dog Friendly" variant="good" />}
                </div>
              </div>
            ))}
          </div>
        )}
        {pe.green_space.trails.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Trails</p>
            {pe.green_space.trails.map((t, i) => (
              <p key={i} className="text-sm text-slate-600">
                {t.name}{t.length_mi != null ? ` (${t.length_mi} mi)` : ''} — {ftToStr(t.distance_ft)}
              </p>
            ))}
          </div>
        )}
        {pe.green_space.waterfront && (
          <p className="text-sm text-blue-600 mb-2">Waterfront access{pe.green_space.waterfront_notes ? ` — ${pe.green_space.waterfront_notes}` : ''}</p>
        )}
        <p className="text-xs text-slate-500">{pe.green_space.pocket_parks} pocket parks</p>
      </Section>
      {pe.public_art.length > 0 && (
        <Section title="Public Art">
          <ul className="space-y-1">
            {pe.public_art.map((a, i) => <li key={i} className="text-sm text-slate-600">{a}</li>)}
          </ul>
        </Section>
      )}
      <Section title="Architecture">
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge label={arch.dominant_style} />
          <Badge label={arch.era} />
          <Badge label={arch.building_heights.replace('_', ' ')} />
          <Badge label={`Facades: ${arch.facade_condition}`} variant={arch.facade_condition === 'excellent' || arch.facade_condition === 'good' ? 'good' : 'warn'} />
          {arch.historic_designation && <Badge label="Historic District" variant="good" />}
          <Badge label={`Renovation: ${arch.renovation_activity}`} variant={arch.renovation_activity === 'active' ? 'good' : 'neutral'} />
        </div>
        <p className="text-sm text-slate-600 mb-3">{arch.architectural_character}</p>
        {arch.notable_buildings.length > 0 && (
          <div className="space-y-2 mb-3">
            {arch.notable_buildings.map((b, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2">
                <p className="text-sm font-medium text-slate-700">{b.name}</p>
                <p className="text-xs text-slate-500">{b.description}</p>
              </div>
            ))}
          </div>
        )}
        {arch.street_art_murals.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Street Art & Murals</p>
            {arch.street_art_murals.map((m, i) => (
              <p key={i} className="text-xs text-slate-500">{m.description} — {m.location}</p>
            ))}
          </div>
        )}
        {arch.vacancy_signals.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-2">
            <p className="text-xs font-semibold text-amber-600 mb-1">Vacancy Signals</p>
            <ul className="space-y-0.5">
              {arch.vacancy_signals.map((v, i) => <li key={i} className="text-xs text-amber-600">· {v}</li>)}
            </ul>
          </div>
        )}
      </Section>
    </div>
  );
}

type AmenityTab = 'food' | 'health' | 'education' | 'retail' | 'recreation' | 'outdoor' | 'nightlife';

function AmenitiesPanel({ tour }: { tour: TourResponse }) {
  const { amenities: am } = tour;
  const [subTab, setSubTab] = useState<AmenityTab>('food');
  const subTabs: { id: AmenityTab; label: string }[] = [
    { id: 'food', label: 'Food & Drink' },
    { id: 'health', label: 'Health' },
    { id: 'education', label: 'Education' },
    { id: 'retail', label: 'Retail' },
    { id: 'recreation', label: 'Recreation' },
    { id: 'outdoor', label: 'Outdoor' },
    { id: 'nightlife', label: 'Nightlife' },
  ];
  return (
    <div>
      <div className="flex gap-1 flex-wrap mb-4">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              subTab === t.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {subTab === 'food' && (
        <div>
          <AmenityGroup title="Coffee Shops" places={am.food_and_drink.coffee_shops} />
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 mb-1">Restaurants</p>
            {am.food_and_drink.restaurants.map((r, i) => <RestaurantRow key={i} place={r} />)}
          </div>
          <AmenityGroup title="Grocery" places={am.food_and_drink.grocery} />
          <AmenityGroup title="Specialty Food" places={am.food_and_drink.specialty_food} />
          <AmenityGroup title="Bars & Nightlife" places={am.food_and_drink.bars_and_nightlife} />
          <AmenityGroup title="Fast Food" places={am.food_and_drink.fast_food} />
          {am.food_and_drink.farmers_market && (
            <div className="bg-emerald-50 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-emerald-800">{am.food_and_drink.farmers_market.name}</p>
              <p className="text-xs text-emerald-600">{am.food_and_drink.farmers_market.schedule} · {ftToStr(am.food_and_drink.farmers_market.distance_ft)}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge label={`Delivery: ${am.food_and_drink.delivery_coverage}`} variant={am.food_and_drink.delivery_coverage === 'excellent' ? 'good' : 'neutral'} />
          </div>
          {am.food_and_drink.food_trucks && <p className="text-xs text-slate-500 mt-2">{am.food_and_drink.food_trucks}</p>}
          {am.food_and_drink.late_night_options && <p className="text-xs text-slate-500 mt-1">Late night: {am.food_and_drink.late_night_options}</p>}
        </div>
      )}
      {subTab === 'health' && (
        <div>
          <AmenityGroup title="Primary Care" places={am.health_and_wellness.primary_care} />
          <AmenityGroup title="Urgent Care" places={am.health_and_wellness.urgent_care} />
          <AmenityGroup title="Hospitals" places={am.health_and_wellness.hospitals} />
          <AmenityGroup title="Pharmacies" places={am.health_and_wellness.pharmacies} />
          <AmenityGroup title="Mental Health" places={am.health_and_wellness.mental_health_services} />
          <AmenityGroup title="Gyms & Fitness" places={am.health_and_wellness.gyms_fitness} />
          <AmenityGroup title="Yoga & Pilates" places={am.health_and_wellness.yoga_pilates} />
          <AmenityGroup title="Spas & Wellness" places={am.health_and_wellness.spas_wellness} />
          <AmenityGroup title="Dental" places={am.health_and_wellness.dental} />
          <AmenityGroup title="Vision" places={am.health_and_wellness.vision} />
          <AmenityGroup title="Specialty Care" places={am.health_and_wellness.specialty_care} />
        </div>
      )}
      {subTab === 'education' && (
        <div>
          {am.education.public_elementary.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Elementary Schools</p>
              {am.education.public_elementary.map((s, i) => <SchoolRow key={i} place={s} />)}
            </div>
          )}
          {am.education.public_middle.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Middle Schools</p>
              {am.education.public_middle.map((s, i) => <SchoolRow key={i} place={s} />)}
            </div>
          )}
          {am.education.public_high.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">High Schools</p>
              {am.education.public_high.map((s, i) => <SchoolRow key={i} place={s} />)}
            </div>
          )}
          {am.education.private_schools.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Private Schools</p>
              {am.education.private_schools.map((s, i) => <SchoolRow key={i} place={s} />)}
            </div>
          )}
          <AmenityGroup title="Universities" places={am.education.universities} />
          <AmenityGroup title="Libraries" places={am.education.libraries} />
          <AmenityGroup title="Childcare & Daycare" places={am.education.childcare_daycare} />
          {am.education.after_school_programs && (
            <p className="text-sm text-slate-600 mt-2">{am.education.after_school_programs}</p>
          )}
        </div>
      )}
      {subTab === 'retail' && (
        <div>
          <AmenityGroup title="Boutique Retail" places={am.retail_and_services.boutique_retail} />
          <AmenityGroup title="Shopping Centers" places={am.retail_and_services.shopping_centers} />
          <AmenityGroup title="Banks & ATMs" places={am.retail_and_services.banks_atms} />
          <AmenityGroup title="Salons & Barbers" places={am.retail_and_services.salons_barbers} />
          <AmenityGroup title="Hardware" places={am.retail_and_services.hardware} />
          <AmenityGroup title="Laundromats" places={am.retail_and_services.laundromats} />
          <AmenityGroup title="Dry Cleaners" places={am.retail_and_services.dry_cleaners} />
          <AmenityGroup title="Pet Services" places={am.retail_and_services.pet_services} />
          <AmenityGroup title="Auto Services" places={am.retail_and_services.auto_services} />
          <AmenityGroup title="Postal" places={am.retail_and_services.postal} />
          <AmenityGroup title="Coworking Spaces" places={am.retail_and_services.coworking_spaces} />
          <AmenityGroup title="Print & Copy" places={am.retail_and_services.print_copy} />
        </div>
      )}
      {subTab === 'recreation' && (
        <div>
          {am.recreation_and_culture.parks.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Parks</p>
              {am.recreation_and_culture.parks.map((p, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-2 mb-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-slate-700">{p.name}</p>
                    <span className="text-xs text-slate-400">{ftToStr(p.distance_ft)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.features.slice(0, 4).map((f, j) => <Badge key={j} label={f} />)}
                    {p.dog_friendly && <Badge label="Dogs OK" variant="good" />}
                  </div>
                </div>
              ))}
            </div>
          )}
          <AmenityGroup title="Playgrounds" places={am.recreation_and_culture.playgrounds} />
          {am.recreation_and_culture.sports_courts.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Sports Courts</p>
              {am.recreation_and_culture.sports_courts.map((c, i) => (
                <div key={i} className="py-1.5 border-b border-slate-50 last:border-0 flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.court_type} · {c.public ? 'Public' : 'Private'}</p>
                  </div>
                  <span className="text-xs text-slate-400">{ftToStr(c.distance_ft)}</span>
                </div>
              ))}
            </div>
          )}
          <AmenityGroup title="Community Centers" places={am.recreation_and_culture.community_centers} />
          <AmenityGroup title="Museums & Galleries" places={am.recreation_and_culture.museums_galleries} />
          <AmenityGroup title="Theaters & Venues" places={am.recreation_and_culture.theaters_venues} />
          <AmenityGroup title="Cinemas" places={am.recreation_and_culture.cinemas} />
          <AmenityGroup title="Dog Parks" places={am.recreation_and_culture.dog_parks} />
          <AmenityGroup title="Entertainment" places={am.recreation_and_culture.bowling_entertainment} />
          {am.recreation_and_culture.religious_institutions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Religious Institutions</p>
              {am.recreation_and_culture.religious_institutions.map((r, i) => (
                <p key={i} className="text-sm text-slate-600">
                  {r.name} ({r.denomination}) — {ftToStr(r.distance_ft)}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      {subTab === 'outdoor' && (
        <div>
          <AmenityGroup title="Hiking Trails" places={am.outdoor_and_nature.hiking_trails} />
          <AmenityGroup title="Bike Trails" places={am.outdoor_and_nature.bike_trails} />
          <AmenityGroup title="Nature Preserves" places={am.outdoor_and_nature.nature_preserves} />
          <AmenityGroup title="Botanical Gardens" places={am.outdoor_and_nature.botanical_gardens} />
          {am.outdoor_and_nature.water_access && (
            <p className="text-sm text-blue-600 mt-2">{am.outdoor_and_nature.water_access}</p>
          )}
        </div>
      )}
      {subTab === 'nightlife' && (
        <div>
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {am.nightlife.bar_count_radius_half_mile != null && (
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-slate-700">{am.nightlife.bar_count_radius_half_mile}</p>
                <p className="text-xs text-slate-400">Bars within 0.5mi</p>
              </div>
            )}
            <Badge label={`Club scene: ${am.nightlife.club_scene}`} />
          </div>
          <AmenityGroup title="Live Music" places={am.nightlife.live_music_venues} />
          <AmenityGroup title="Karaoke" places={am.nightlife.karaoke} />
          <AmenityGroup title="Late Night Food" places={am.nightlife.late_night_food} />
          {am.nightlife.noise_impact_on_residents && (
            <p className="text-xs text-slate-500 mt-3">Resident impact: {am.nightlife.noise_impact_on_residents}</p>
          )}
        </div>
      )}
    </div>
  );
}

function RealEstatePanel({ tour }: { tour: TourResponse }) {
  const { real_estate: re } = tour;
  return (
    <div>
      <Section title="Rent">
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: '1BR', val: re.median_rent_1br },
            { label: '2BR', val: re.median_rent_2br },
            { label: '3BR', val: re.median_rent_3br },
          ].map(({ label, val }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-slate-800">{fmtUsd(val)}</p>
              <p className="text-xs text-slate-400">{label}/mo</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge
            label={`Trend: ${re.rent_trend.replace('_', ' ')}`}
            variant={re.rent_trend === 'falling' ? 'good' : re.rent_trend === 'rising_fast' ? 'bad' : 'neutral'}
          />
          {re.yoy_rent_change_pct != null && (
            <Badge
              label={`YoY: ${re.yoy_rent_change_pct > 0 ? '+' : ''}${re.yoy_rent_change_pct}%`}
              variant={re.yoy_rent_change_pct > 5 ? 'bad' : re.yoy_rent_change_pct < 0 ? 'good' : 'neutral'}
            />
          )}
          <Badge label={`Inventory: ${re.inventory_level.replace('_', ' ')}`} />
        </div>
        <p className="text-sm text-slate-600">{re.affordability_notes}</p>
      </Section>
      <Section title="Buy">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-800">{fmtUsd(re.median_home_value)}</p>
            <p className="text-xs text-slate-400">Median Home Value</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-800">{re.price_per_sqft != null ? `$${re.price_per_sqft}` : '—'}</p>
            <p className="text-xs text-slate-400">Price / sq ft</p>
          </div>
        </div>
        {re.days_on_market_avg != null && (
          <p className="text-xs text-slate-500 mb-2">Avg {re.days_on_market_avg} days on market</p>
        )}
        {re.renter_vs_owner_pct && (
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-1">Renters {re.renter_vs_owner_pct.renters}% · Owners {re.renter_vs_owner_pct.owners}%</p>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-2 bg-emerald-400" style={{ width: `${re.renter_vs_owner_pct.renters}%` }} />
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {re.property_types.map((t, i) => <Badge key={i} label={t} />)}
        </div>
      </Section>
      <Section title="Development & Zoning">
        <div className="flex flex-wrap gap-1 mb-3">
          {re.recent_development.new_construction_active && <Badge label="New Construction Active" variant="warn" />}
          {re.recent_development.conversions_active && <Badge label="Conversions Active" variant="neutral" />}
          {re.recent_development.demolitions_active && <Badge label="Demolitions Active" variant="bad" />}
          <Badge
            label={re.gentrification_stage.replace(/_/g, ' ')}
            variant={re.gentrification_stage === 'stable' ? 'good' : re.gentrification_stage === 'advanced' ? 'bad' : 'warn'}
          />
        </div>
        {re.recent_development.notes && <p className="text-sm text-slate-600 mb-3">{re.recent_development.notes}</p>}
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-500 mb-1">Zoning: {re.zoning.primary_zone}</p>
          <div className="flex flex-wrap gap-1">
            {re.zoning.mixed_use_zones && <Badge label="Mixed Use Zones" />}
            {re.zoning.upzoning_activity && <Badge label="Upzoning Activity" variant="warn" />}
          </div>
          {re.zoning.notes && <p className="text-xs text-slate-500 mt-2">{re.zoning.notes}</p>}
        </div>
      </Section>
      {re.investment_signals.length > 0 && (
        <Section title="Investment Signals">
          <ul className="space-y-1">
            {re.investment_signals.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-emerald-500">↑</span>{s}</li>
            ))}
          </ul>
        </Section>
      )}
      {re.utility_costs_notes && (
        <Section title="Utility Costs">
          <p className="text-sm text-slate-600">{re.utility_costs_notes}</p>
        </Section>
      )}
    </div>
  );
}

function CommunityPanel({ tour }: { tour: TourResponse }) {
  const { community: com } = tour;
  return (
    <div>
      <Section title="Demographics">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { l: 'Density', v: com.population_density.replace('_', ' ') },
            { l: 'Age Profile', v: com.age_profile.replace('_', ' ') },
          ].map(({ l, v }) => (
            <div key={l} className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-sm font-semibold text-slate-700 capitalize">{v}</p>
              <p className="text-xs text-slate-400">{l}</p>
            </div>
          ))}
        </div>
        {com.population_estimate != null && (
          <p className="text-xs text-slate-500 mb-2">~{com.population_estimate.toLocaleString()} residents</p>
        )}
        <p className="text-sm text-slate-600 mb-2">{com.notable_demographics}</p>
        {com.languages_commonly_spoken.length > 0 && (
          <p className="text-xs text-slate-500">Languages: {com.languages_commonly_spoken.join(', ')}</p>
        )}
      </Section>
      <Section title="Character">
        <p className="text-sm text-slate-700 mb-2">{com.cultural_character}</p>
        <p className="text-sm text-slate-600 mb-2">{com.social_scene}</p>
        <p className="text-xs text-slate-500 mb-3">Political climate: {com.political_climate}</p>
        <div className="flex flex-wrap gap-1">
          <Badge label={`Pets: ${com.pet_friendliness.replace('_', ' ')}`} variant={com.pet_friendliness === 'very_friendly' ? 'good' : 'neutral'} />
          <Badge label={`Kids: ${com.child_friendliness}`} variant={com.child_friendliness === 'excellent' || com.child_friendliness === 'good' ? 'good' : 'warn'} />
          <Badge label={`Seniors: ${com.senior_friendliness}`} variant={com.senior_friendliness === 'excellent' || com.senior_friendliness === 'good' ? 'good' : 'warn'} />
          <Badge label={`Engagement: ${com.community_engagement}`} />
        </div>
        <p className="text-sm text-slate-600 mt-3">{com.lgbtq_friendliness}</p>
      </Section>
      {com.neighborhood_associations.length > 0 && (
        <Section title="Neighborhood Associations">
          <ul className="space-y-1">
            {com.neighborhood_associations.map((a, i) => (
              <li key={i} className="text-sm text-slate-600">· {a}</li>
            ))}
          </ul>
        </Section>
      )}
      {com.notable_events.length > 0 && (
        <Section title="Notable Events">
          <ul className="space-y-1">
            {com.notable_events.map((e, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-emerald-500">◆</span>{e}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function GeniePanel({ tour }: { tour: TourResponse }) {
  const { genie_world } = tour;
  return (
    <div>
      <div className={`rounded-xl p-4 mb-5 ${genie_world.available ? 'bg-emerald-50' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-lg font-bold ${genie_world.available ? 'text-emerald-800' : 'text-slate-500'}`}>
            Genie 3 World
          </span>
          <Badge label={genie_world.available ? 'Live' : 'Coming Soon'} variant={genie_world.available ? 'good' : 'neutral'} />
        </div>
        {genie_world.available && genie_world.world_url ? (
          <iframe
            src={genie_world.world_url}
            className="w-full h-80 rounded-lg border-0"
            allow="xr-spatial-tracking"
            title="Genie 3 Interactive World"
          />
        ) : (
          <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
            <p className="text-3xl mb-2">&#127757;</p>
            <p className="text-sm font-medium text-slate-700 mb-1">Interactive World Preview</p>
            <p className="text-xs text-slate-400">
              {genie_world.fallback_reason ?? 'Genie 3 world generation will appear here when the Vertex AI API ships.'}
            </p>
          </div>
        )}
      </div>
      {genie_world.prompt_used && (
        <Section title="World Prompt">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-600 font-mono leading-relaxed">{genie_world.prompt_used}</p>
          </div>
        </Section>
      )}
      {genie_world.suggested_exploration_prompts.length > 0 && (
        <Section title="Suggested Exploration Prompts">
          <p className="text-xs text-slate-400 mb-2">Use these when the Genie 3 API becomes available:</p>
          <div className="space-y-2">
            {genie_world.suggested_exploration_prompts.map((p, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-600 font-mono">{p}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700 font-medium mb-1">What Genie 3 adds to StelarGem:</p>
        <ul className="space-y-1">
          {[
            'Interactive first-person neighborhood walkthroughs at 24 FPS',
            'Coverage for areas with no Google Street View',
            'Time-of-day and seasonal variations on demand',
            'Future-state visualization of proposed developments',
          ].map((item, i) => (
            <li key={i} className="text-xs text-blue-600">· {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InspectionPanel({ tour }: { tour: TourResponse }) {
  const { inspection_checklist } = tour;
  const priorityColor = (p: string) => {
    if (p === 'critical') return 'text-red-700 bg-red-50';
    if (p === 'high') return 'text-orange-700 bg-orange-50';
    if (p === 'medium') return 'text-amber-700 bg-amber-50';
    return 'text-slate-600 bg-slate-100';
  };
  return (
    <div>
      <p className="text-xs text-slate-400 mb-4">For property arrival tours — review before your visit.</p>
      {inspection_checklist.map((cat, ci) => (
        <Section key={ci} title={`${cat.icon} ${cat.category}`}>
          <div className="space-y-2">
            {cat.items.map((item, ii) => (
              <div key={ii} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-800">{item.item}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${priorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-1">{item.what_to_look_for}</p>
                {item.red_flags.length > 0 && (
                  <div className="bg-red-50 rounded p-1.5 mt-1">
                    {item.red_flags.map((f, fi) => (
                      <p key={fi} className="text-xs text-red-600">Warning: {f}</p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1 capitalize">For: {item.applies_to}</p>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}

function FraudPanel({ tour }: { tour: TourResponse }) {
  const { fraud_flags } = tour;
  const severityBorder = (s: string) => {
    if (s === 'critical') return 'border-red-300 bg-red-50';
    if (s === 'high') return 'border-orange-300 bg-orange-50';
    if (s === 'medium') return 'border-amber-300 bg-amber-50';
    return 'border-slate-200 bg-slate-50';
  };
  const severityText = (s: string) => {
    if (s === 'critical') return 'text-red-700';
    if (s === 'high') return 'text-orange-700';
    if (s === 'medium') return 'text-amber-700';
    return 'text-slate-600';
  };
  if (!fraud_flags.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-emerald-700">No fraud flags detected</p>
        <p className="text-xs text-slate-400 mt-1">No listing anomalies were identified by the AI review.</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs text-slate-400 mb-4">AI-detected anomalies between listing claims and observed data.</p>
      {fraud_flags.map((flag, i) => (
        <div key={i} className={`rounded-xl p-4 mb-3 border ${severityBorder(flag.severity)}`}>
          <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${severityText(flag.severity)}`}>
            {flag.severity} · {flag.flag_type.replace(/_/g, ' ')}
          </p>
          <div className="space-y-1.5">
            <div>
              <p className="text-xs font-semibold text-slate-500">Claim</p>
              <p className="text-sm text-slate-700">{flag.claim}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Observation</p>
              <p className="text-sm text-slate-700">{flag.observation}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Recommendation</p>
              <p className="text-sm text-slate-700">{flag.recommendation}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function TourPage() {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<TourResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .post<TourResponse>('/api/tour/narrate', { neighborhood_id: id, tour_type: 'neighborhood_walk' })
      .then((data) => setTour(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const tabs = tour
    ? [
        ...BASE_TABS,
        ...(tour.inspection_checklist.length > 0 ? [{ id: 'inspection' as Tab, label: 'Inspection' }] : []),
        ...(tour.fraud_flags.length > 0 ? [{ id: 'fraud' as Tab, label: `Fraud (${tour.fraud_flags.length})` }] : []),
      ]
    : BASE_TABS;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-3 shrink-0">
        <Link to={`/neighborhoods/${id}`} className="text-emerald-700 text-sm hover:underline">
          Back
        </Link>
        {tour && (
          <h1 className="text-base font-semibold text-slate-800">
            {tour.meta.neighborhood}, {tour.meta.city}
            <span className="ml-2 text-xs font-normal text-slate-400">AI Tour · {tour.meta.model}</span>
          </h1>
        )}
        {loading && <span className="text-sm text-slate-400 animate-pulse">Generating tour…</span>}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Gemma 4 is generating your tour…</p>
            <p className="text-xs text-slate-400 mt-1">This takes 10–30 seconds.</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <p className="text-sm font-medium text-red-600 mb-1">Tour generation failed</p>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
        </div>
      )}

      {tour && (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 shrink-0 border-r border-slate-100">
            <MapPanel
              neighborhood={tour.meta.neighborhood}
              city={tour.meta.city}
              state={tour.meta.state}
            />
          </div>
          <div className="w-1/2 flex flex-col overflow-hidden">
            <div className="flex gap-0.5 overflow-x-auto px-4 pt-3 pb-0 border-b border-slate-100 shrink-0">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-t-md transition-colors border-b-2 ${
                    activeTab === t.id
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {activeTab === 'overview' && <OverviewPanel tour={tour} />}
              {activeTab === 'navigation' && <NavigationPanel tour={tour} />}
              {activeTab === 'safety' && <SafetyPanel tour={tour} />}
              {activeTab === 'environment' && <EnvironmentPanel tour={tour} />}
              {activeTab === 'amenities' && <AmenitiesPanel tour={tour} />}
              {activeTab === 'real_estate' && <RealEstatePanel tour={tour} />}
              {activeTab === 'community' && <CommunityPanel tour={tour} />}
              {activeTab === 'genie' && <GeniePanel tour={tour} />}
              {activeTab === 'inspection' && <InspectionPanel tour={tour} />}
              {activeTab === 'fraud' && <FraudPanel tour={tour} />}
              <p className="text-xs text-slate-300 mt-6 pb-2">{tour.meta.disclaimer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
