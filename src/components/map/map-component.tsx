'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useRef, useEffect } from 'react';
import type { Map } from 'leaflet';

export default function MapComponent() {
  const position: [number, number] = [-41.2865, 174.7762]; // Centered on Wellington, NZ
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    // This effect runs only once on mount.
    // The cleanup function it returns runs on unmount.
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <MapContainer
      center={position}
      zoom={6}
      scrollWheelZoom={true}
      className="h-full w-full"
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
