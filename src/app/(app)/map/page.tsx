
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Job } from "@/lib/data";
import { collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { LoaderCircle } from "lucide-react";

const containerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '0.5rem',
};

// Centered on New Zealand
const center = {
  lat: -40.900557,
  lng: 174.885971
};

export default function MapPage() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  });

  const firestore = useFirestore();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "job_packs"), where('status', '!=', 'Pending'));
  }, [firestore]);

  const { data: jobData, isLoading } = useCollection<Job>(jobsQuery);

  const markers = useMemo(() => {
    if (!jobData) return [];
    
    return jobData
      .filter(job => job.status !== 'Cancelled' && job.coordinates)
      .map(job => ({
        id: job.id,
        position: {
          lat: job.coordinates.lat,
          lng: job.coordinates.lng,
        },
        title: job.jobNumber,
      }));
  }, [jobData]);

  const mapIsLoading = isLoading || !isLoaded;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Job Map</CardTitle>
        <CardDescription>
          An overview of all active and upcoming job sites.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mapIsLoading ? (
          <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground border-2 border-dashed rounded-lg">
            <LoaderCircle className="w-16 h-16 mb-4 animate-spin" />
            <p className="text-lg font-semibold">Loading Map & Jobs...</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={5}
          >
            {markers.map((marker) => (
              <MarkerF
                key={marker.id}
                position={marker.position}
                title={marker.title}
              />
            ))}
          </GoogleMap>
        )}
      </CardContent>
    </Card>
  );
}
