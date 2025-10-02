import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
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

// Track if Google Maps script is loading globally
let isLoadingGoogleMaps = false;
let googleMapsLoadPromise: Promise<void> | null = null;

const GoogleMap = ({ locations }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = () => {
      if (!mapRef.current || !window.google?.maps || !isMounted) {
        console.log('Cannot init map:', { hasRef: !!mapRef.current, hasGoogle: !!window.google?.maps, isMounted });
        return;
      }

      try {
        console.log('Initializing map with locations:', locations);

        // Calculate center
        const centerLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
        const centerLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

        console.log('Map center:', { centerLat, centerLng });

        // Create map
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 13,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });

        // Add markers
        locations.forEach((location) => {
          console.log('Adding marker for:', location.name);
          new window.google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: mapInstanceRef.current,
            title: location.name,
          });
        });

        // Fit bounds to show all markers
        if (locations.length > 1) {
          const bounds = new window.google.maps.LatLngBounds();
          locations.forEach((loc) => {
            bounds.extend({ lat: loc.lat, lng: loc.lng });
          });
          mapInstanceRef.current.fitBounds(bounds);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    };

    const loadGoogleMapsScript = async (): Promise<void> => {
      // If already loaded, return immediately
      if (window.google?.maps) {
        console.log('Google Maps already loaded');
        return;
      }

      // If already loading, wait for that promise
      if (isLoadingGoogleMaps && googleMapsLoadPromise) {
        console.log('Google Maps already loading, waiting...');
        return googleMapsLoadPromise;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Google Maps script tag exists, waiting for load...');
        isLoadingGoogleMaps = true;
        googleMapsLoadPromise = new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (window.google?.maps) {
              clearInterval(checkInterval);
              isLoadingGoogleMaps = false;
              googleMapsLoadPromise = null;
              resolve();
            }
          }, 100);
        });
        return googleMapsLoadPromise;
      }

      // Get API key and load script
      console.log('Fetching API key...');
      const { data, error: keyError } = await supabase.functions.invoke('get-maps-key');
      
      if (keyError) {
        console.error('Error fetching API key:', keyError);
        throw keyError;
      }
      if (!data?.apiKey) {
        console.error('No API key in response:', data);
        throw new Error('No API key received');
      }

      console.log('API key received, loading script...');
      isLoadingGoogleMaps = true;

      googleMapsLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('Google Maps script loaded successfully');
          isLoadingGoogleMaps = false;
          googleMapsLoadPromise = null;
          resolve();
        };
        
        script.onerror = (e) => {
          console.error('Failed to load Google Maps script:', e);
          isLoadingGoogleMaps = false;
          googleMapsLoadPromise = null;
          reject(new Error('Failed to load Google Maps'));
        };

        document.head.appendChild(script);
      });

      return googleMapsLoadPromise;
    };

    const loadMap = async () => {
      try {
        if (!locations || locations.length === 0) {
          setIsLoading(false);
          return;
        }

        await loadGoogleMapsScript();
        
        if (isMounted) {
          initMap();
        }
      } catch (err) {
        console.error('Error in loadMap:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load map');
          setIsLoading(false);
        }
      }
    };

    loadMap();

    return () => {
      isMounted = false;
    };
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
