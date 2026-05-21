import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../lib/mapsLoader.ts';

interface Props {
  lat: number;
  lon: number;
  /** Compass heading in degrees (0=North, 90=East) toward the property entrance. */
  initialHeading?: number;
  /** Called whenever the user pans the panorama. */
  onHeadingChange?: (heading: number) => void;
  /** Called when no Street View coverage exists at this location. */
  onNoPanorama?: () => void;
  /** Children rendered as overlays inside the panorama container. */
  overlayChildren?: React.ReactNode;
}

type PanoState = 'loading' | 'ready' | 'no_coverage' | 'error';

export default function StreetViewPanel({
  lat,
  lon,
  initialHeading = 0,
  onHeadingChange,
  onNoPanorama,
  overlayChildren,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [state, setState] = useState<PanoState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadGoogleMaps();
      } catch (err) {
        if (!cancelled) {
          setState('error');
          setErrorMsg(String(err));
        }
        return;
      }

      if (!containerRef.current || cancelled) return;

      const svService = new google.maps.StreetViewService();
      const location = new google.maps.LatLng(lat, lon);

      svService.getPanorama(
        { location, radius: 80, source: google.maps.StreetViewSource.OUTDOOR },
        (data, status) => {
          if (cancelled) return;

          if (status !== google.maps.StreetViewStatus.OK || !data?.location?.latLng) {
            setState('no_coverage');
            onNoPanorama?.();
            return;
          }

          // Compute heading from Street View position toward property coordinates
          const svLatLng = data.location.latLng;
          const propertyLatLng = new google.maps.LatLng(lat, lon);
          const computedHeading = google.maps.geometry.spherical.computeHeading(svLatLng, propertyLatLng);
          const heading = initialHeading !== 0 ? initialHeading : computedHeading;

          if (!containerRef.current) return;

          const panorama = new google.maps.StreetViewPanorama(containerRef.current, {
            pano: data.location.pano,
            pov: { heading, pitch: 0 },
            zoom: 0,
            fullscreenControl: false,
            linksControl: true,
            panControl: true,
            zoomControl: true,
            enableCloseButton: false,
            showRoadLabels: true,
            addressControl: false,
          });

          panoramaRef.current = panorama;
          setState('ready');

          if (onHeadingChange) {
            panorama.addListener('pov_changed', () => {
              const pov = panorama.getPov();
              if (pov?.heading !== undefined) onHeadingChange(pov.heading);
            });
          }
        },
      );
    }

    init();
    return () => { cancelled = true; };
  }, [lat, lon, initialHeading, onHeadingChange, onNoPanorama]);

  // Update heading when prop changes (narration advances to next segment)
  useEffect(() => {
    if (panoramaRef.current && state === 'ready' && initialHeading !== 0) {
      const current = panoramaRef.current.getPov();
      panoramaRef.current.setPov({ heading: initialHeading, pitch: current?.pitch ?? 0 });
    }
  }, [initialHeading, state]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-800">
      {/* Street View container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading state */}
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="text-center text-slate-300">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading Street View…</p>
          </div>
        </div>
      )}

      {/* No coverage state */}
      {state === 'no_coverage' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="text-center text-slate-300 px-6">
            <div className="text-3xl mb-2">🗺</div>
            <p className="font-semibold text-slate-200 mb-1">No Street View at this location</p>
            <p className="text-xs text-slate-400">Use the aerial view to explore the property and surrounding area.</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="text-center text-slate-300 px-6">
            <div className="text-3xl mb-2">⚠</div>
            <p className="font-semibold text-slate-200 mb-1">Maps unavailable</p>
            <p className="text-xs text-slate-400">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Overlay children (narration bubbles, compass, etc.) */}
      {state === 'ready' && overlayChildren && (
        <div className="absolute inset-0 pointer-events-none">
          {overlayChildren}
        </div>
      )}

      {/* Compass indicator */}
      {state === 'ready' && (
        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white pointer-events-none">
          360° interactive
        </div>
      )}
    </div>
  );
}
