import { useEffect, useState } from "react";
import { RANGES, type DistanceRange } from "~/types/distance";
import type { LocationPreference } from "~/types/location";
import { Preference } from "~/types/preference";
import { type ServicePreference } from "~/types/service";
import { DistanceRangeSelector } from "./form/distange-range-selector";
import { LocationSelector } from "./form/location-selector";
import ServiceSelector from "./form/service-selector";

interface PreferencesFormProps {
  services: ServicePreference[];
  preferences: Preference;
  onLocationChange: (newLocation: LocationPreference) => void;
  onDistanceRangeChange: (newDistanceRange: DistanceRange) => void;
  onServiceChange: (newService: ServicePreference) => void;
}

export function PreferencesForm({ services, preferences, onLocationChange, onDistanceRangeChange, onServiceChange }: PreferencesFormProps) {
  const [selectedRange, setSelectedRange] = useState(preferences.range);
  const [selectedLocation, setSelectedLocation] = useState(preferences.location);
  const [selectedService, setSelectedService] = useState(preferences.service);

  useEffect(() => {
    if (selectedRange?.id !== preferences?.range?.id) {
      setSelectedRange(preferences.range);
    }
    if (!selectedLocation?.equals(preferences?.location)) {
      setSelectedLocation(preferences.location);
    }
    if (selectedService?.id !== preferences?.service?.id) {
      setSelectedService(preferences.service);
    }
  }, [ preferences?.id ]);

  return (
    <form id="preferences-form" className="flex flex-col gap-8" onSubmit={() => false}>
      <fieldset className="space-y-2 relative border-none p-0 m-0">
        <legend className="block font-pop text-2xl text-fun-dark tracking-wide mb-2">
          Near where?
        </legend>

        {selectedLocation?.label?.compact}
        <LocationSelector
          selectedLocation={selectedLocation}
          onChange={(newLocation) => {
            if (newLocation && !newLocation.equals(selectedLocation)) {
              setSelectedLocation(newLocation);
              onLocationChange(newLocation);
            }
          }}
        />

        <DistanceRangeSelector
          selectedRange={selectedRange}
          ranges={RANGES}
          onChange={(newDistanceRange) => {
            if (newDistanceRange && newDistanceRange.id !== selectedRange?.id) {
              setSelectedRange(newDistanceRange);
              onDistanceRangeChange(newDistanceRange);
            }
          }}
        />
      </fieldset>

      <ServiceSelector
        services={services}
        selectedService={selectedService}
        onChange={(newService) => {
          if (newService && newService.id !== selectedService?.id) {
            setSelectedService(newService);
            onServiceChange(newService);
          }
        }} />
    </form>
  );
}
