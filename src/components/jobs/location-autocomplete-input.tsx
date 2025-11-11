'use client';

import { useRef, useState, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';

interface LocationAutocompleteInputProps {
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
  initialValue?: string;
}

export function LocationAutocompleteInput({ onPlaceSelected, initialValue = '' }: LocationAutocompleteInputProps) {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      onPlaceSelected(place);
      if (inputRef.current) {
        inputRef.current.value = place.formatted_address || '';
      }
    } else {
      console.error('Autocomplete is not loaded yet!');
    }
  };

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        componentRestrictions: { country: 'nz' } // Restrict to New Zealand
      }}
      fields={["formatted_address", "geometry", "name"]}
    >
      <Input
        ref={inputRef}
        type="text"
        placeholder="Start typing an address..."
        defaultValue={initialValue}
      />
    </Autocomplete>
  );
}
