'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

export default function MapComponent() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only once on the client, after the initial render.
    setIsClient(true);
  }, []);

  const position: [number, number] = [-41.2865, 174.7762]; // Centered on Wellington, NZ

  // Render a loader or placeholder until the component is mounted on the client.
  if (!isClient) {
    return (
        <div className="flex h-full w-full items-center justify-center bg-muted">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  // Once isClient is true, render the actual MapContainer.
  return (
    <MapContainer
      center={position}
      zoom={6}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
