import React, { useEffect, useRef } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS || '';

let googleMapsScriptPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (googleMapsScriptPromise) return googleMapsScriptPromise;

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('VITE_GOOGLE_MAPS key missing');
      resolve();
      return;
    }
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
};

interface GoogleAddressInputProps {
  value: string;
  onChange: (address: string) => void;
  onSelectCoords?: (coords: [number, number]) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const GoogleAddressInput: React.FC<GoogleAddressInputProps> = ({
  value,
  onChange,
  onSelectCoords,
  placeholder = 'Search address or location...',
  className = '',
  required = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const onSelectCoordsRef = useRef(onSelectCoords);

  useEffect(() => {
    onChangeRef.current = onChange;
    onSelectCoordsRef.current = onSelectCoords;
  });

  useEffect(() => {
    let active = true;

    loadGoogleMapsScript()
      .then(() => {
        if (!active || !inputRef.current || !(window as any).google?.maps?.places) return;

        if (!autocompleteRef.current) {
          const autocomplete = new (window as any).google.maps.places.Autocomplete(
            inputRef.current,
            { types: ['geocode', 'establishment'] }
          );

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place && place.geometry && place.geometry.location) {
              const lat = Number(place.geometry.location.lat());
              const lng = Number(place.geometry.location.lng());
              const address = place.formatted_address || place.name || inputRef.current?.value || '';
              onChangeRef.current(address);
              if (onSelectCoordsRef.current && Number.isFinite(lat) && Number.isFinite(lng)) {
                onSelectCoordsRef.current([lat, lng]);
              }
            } else if (inputRef.current?.value) {
              onChangeRef.current(inputRef.current.value);
            }
          });

          autocompleteRef.current = autocomplete;
        }
      })
      .catch((err) => {
        console.warn('Failed to load Google Maps script', err);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      required={required}
    />
  );
};
