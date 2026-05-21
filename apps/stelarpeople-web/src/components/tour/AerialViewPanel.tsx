import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../lib/mapsLoader.ts';

interface Props {
  lat: number;
  lon: number;
  label?: string;
}

export default function AerialViewPanel({ lat, lon, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const mapId = import.meta.env.VITE_GOOGLE_MAPS_ID as string | undefined;
        new google.maps.Map(containerRef.current, {
          center: { lat, lng: lon },
          zoom: 19,
          tilt: 45,
          heading: 0,
          mapTypeId: 'satellite',
          ...(mapId ? { mapId } : {}),
          disableDefaultUI: false,
          fullscreenControl: false,
        });
        setReady(true);
      })
      .catch((err) => { if (!cancelled) setError(String(err)); });
    return () => { cancelled = true; };
  }, [lat, lon]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-800">
      <div ref={containerRef} className="w-full h-full" />

      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <p className="text-slate-400 text-sm text-center px-4">{error}</p>
        </div>
      )}

      {ready && label && (
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded pointer-events-none">
          {label}
        </div>
      )}

      {ready && (
        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded px-2 py-1 text-xs text-white pointer-events-none">
          Photorealistic 3D · Tilt 45°
        </div>
      )}
    </div>
  );
}
