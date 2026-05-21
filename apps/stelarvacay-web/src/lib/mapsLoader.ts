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
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'));
      return;
    }

    const callbackName = '__stelarVacayMapsReady';
    (window as Record<string, unknown>)[callbackName] = () => {
      window.__mapsLoaded = true;
      resolve();
      delete (window as Record<string, unknown>)[callbackName];
    };

    const script = document.createElement('script');
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&libraries=maps,streetView,marker,geometry&v=beta&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps.'));
    document.head.appendChild(script);
  });

  return window.__mapsLoadPromise;
}
