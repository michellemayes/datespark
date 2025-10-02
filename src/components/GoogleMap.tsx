import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Declare Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        Map: any;
        Marker: any;
        LatLngBounds: any;
      };
    };
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMap = async () => {
      try {
        // Get API key from edge function
        const { data, error: keyError } = await supabase.functions.invoke('get-maps-key');
        
        if (keyError) throw keyError;
        if (!data?.apiKey) throw new Error('No API key received');

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          initMap();
          setIsLoading(false);
        };
        
        script.onerror = () => {
          setError('Failed to load Google Maps');
          setIsLoading(false);
        };

        document.head.appendChild(script);

        return () => {
          document.head.removeChild(script);
        };
      } catch (err) {
        console.error('Error loading map:', err);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      // Calculate center
      const centerLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
      const centerLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 13,
        mapTypeControl: false,
      });

      // Add markers
      locations.forEach((location) => {
        new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: map,
          title: location.name,
        });
      });

      // Fit bounds to show all markers
      if (locations.length > 1) {
        const bounds = new window.google.maps.LatLngBounds();
        locations.forEach((loc) => {
          bounds.extend({ lat: loc.lat, lng: loc.lng });
        });
        map.fitBounds(bounds);
      }
    };

    if (locations && locations.length > 0) {
      loadMap();
    }
  }, [locations]);

  if (!locations || locations.length === 0) return null;

  if (error) {
    return (
      <div className="w-full h-64 rounded-lg bg-muted flex items-center justify-center border border-border">
        <span className="text-sm text-destructive">{error}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-64 rounded-lg bg-muted animate-pulse flex items-center justify-center border border-border">
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="w-full h-64 rounded-lg border border-border" />
  );
};

export default GoogleMap;
