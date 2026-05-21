declare global {
  interface Window {
    __mapsLoadPromise?: Promise<void>;
    __mapsLoaded?: boolean;
  }
}

export function loadGoogleMaps(): Promise<void> {
  if (window.__mapsLoaded) return Promise.resolve();
  if (window.__mapsLoadPromise) return window.__mapsLoadPromise;

  window.__mapsLoadPromise = new Promise<void>((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set — Google Maps unavailable.'));
      return;
    }

    const callbackName = '__stelarPeopleMapsReady';
    (window as Record<string, unknown>)[callbackName] = () => {
      window.__mapsLoaded = true;
      resolve();
      delete (window as Record<string, unknown>)[callbackName];
    };

    const script = document.createElement('script');
    // streetView + geometry libraries required for StreetViewService + heading computation
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&libraries=maps,streetView,marker,geometry&v=beta&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps script.'));
    document.head.appendChild(script);
  });

  return window.__mapsLoadPromise;
}

export function isGoogleMapsAvailable(): boolean {
  return typeof google !== 'undefined' && typeof google.maps !== 'undefined';
}
