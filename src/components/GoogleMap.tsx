import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: any;
    googleMapsReady?: boolean;
  }
}

interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface GoogleMapProps {
  locations: Location[];
}

const GoogleMap = ({ locations }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locations || locations.length === 0) return;

    const initializeMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      // Calculate center from locations
      const centerLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
      const centerLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 12,
      });

      // Add markers for each location
      locations.forEach((location) => {
        new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: map,
          title: location.name,
        });
      });

      // Fit bounds if multiple locations
      if (locations.length > 1) {
        const bounds = new window.google.maps.LatLngBounds();
        locations.forEach((loc) => {
          bounds.extend({ lat: loc.lat, lng: loc.lng });
        });
        map.fitBounds(bounds);
      }
    };

    const loadGoogleMaps = async () => {
      try {
        // If Google Maps is already loaded, just initialize
        if (window.google?.maps) {
          initializeMap();
          return;
        }

        // If already loading, wait for it
        if (window.googleMapsReady === false) {
          const checkInterval = setInterval(() => {
            if (window.google?.maps) {
              clearInterval(checkInterval);
              initializeMap();
            }
          }, 100);
          return;
        }

        // Mark as loading
        window.googleMapsReady = false;

        // Get API key
        const { data, error: keyError } = await supabase.functions.invoke('get-maps-key');
        if (keyError || !data?.apiKey) {
          throw new Error('Failed to get Maps API key');
        }

        // Load script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}`;
        script.async = true;
        
        script.onload = () => {
          window.googleMapsReady = true;
          initializeMap();
        };
        
        script.onerror = () => {
          setError('Failed to load Google Maps');
        };

        // Only add if not already present
        if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
          document.head.appendChild(script);
        }
      } catch (err) {
        setError('Failed to load map');
        console.error(err);
      }
    };

    loadGoogleMaps();
  }, [locations]);

  if (!locations || locations.length === 0) return null;

  if (error) {
    return (
      <div className="w-full h-64 rounded-lg bg-muted flex items-center justify-center border border-border">
        <span className="text-sm text-destructive">{error}</span>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="w-full h-64 rounded-lg border border-border bg-muted" />
  );
};

export default GoogleMap;
