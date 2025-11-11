
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GoogleMap, MarkerF, InfoWindow } from '@react-google-maps/api';
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Job } from "@/lib/data";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { useMemo, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { isPast } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

const getDisplayedStatus = (job: Job) => {
  const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
  if (job.status === 'Upcoming' && isPast(startDate)) {
    return 'In Progress';
  }
  return job.status;
};


export default function MapPage() {
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);
  const firestore = useFirestore();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "job_packs"), where('status', 'in', ['Upcoming', 'In Progress']));
  }, [firestore]);

  const { data: jobData, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);

  const markers = useMemo(() => {
    if (!jobData) return [];
    
    return jobData
      .filter(job => job.coordinates && (getDisplayedStatus(job) === 'Upcoming' || getDisplayedStatus(job) === 'In Progress'))
      .map(job => ({
        id: job.id,
        position: {
          lat: job.coordinates!.lat,
          lng: job.coordinates!.lng,
        },
        title: job.jobNumber,
        location: job.location,
      }));
  }, [jobData]);

  const mapIsLoading = isLoadingJobs || typeof window === 'undefined' || !window.google?.maps?.places;

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
            zoom={6}
          >
            {markers.map((marker) => (
              <MarkerF
                key={marker.id}
                position={marker.position}
                title={marker.title}
                onClick={() => setSelectedMarker(marker)}
              />
            ))}

            {selectedMarker && (
                <InfoWindow
                    position={selectedMarker.position}
                    onCloseClick={() => setSelectedMarker(null)}
                    options={{ disableAutoPan: false }}
                >
                    <div className="p-4 pr-10 space-y-2 bg-background text-foreground rounded-lg shadow-lg relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => setSelectedMarker(null)}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                        <h4 className="font-bold text-base">{selectedMarker.title}</h4>
                        <p className="text-sm text-muted-foreground">{selectedMarker.location}</p>
                        <Link href={`/jobs/${selectedMarker.id}`} className="text-sm text-primary hover:underline font-semibold block pt-1">
                            View Details
                        </Link>
                    </div>
                </InfoWindow>
            )}
          </GoogleMap>
        )}
      </CardContent>
    </Card>
  );
}
