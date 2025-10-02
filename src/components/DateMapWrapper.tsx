import { lazy, Suspense } from 'react';

const DateMap = lazy(() => import('./DateMap'));

interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface DateMapWrapperProps {
  locations: Location[];
}

const DateMapWrapper = ({ locations }: DateMapWrapperProps) => {
  if (!locations || locations.length === 0) return null;

  return (
    <Suspense fallback={
      <div className="w-full h-64 rounded-lg bg-muted animate-pulse flex items-center justify-center border border-border">
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    }>
      <DateMap locations={locations} />
    </Suspense>
  );
};

export default DateMapWrapper;
