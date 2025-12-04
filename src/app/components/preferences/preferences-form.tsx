import { RANGES, type DistanceRange } from "~/types/distance";
import { areLocationEquals, type LocationPreference } from "~/types/location";
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
  return (
    <form id="preferences-form" className="flex flex-col gap-8" onSubmit={() => false}>
      <fieldset className="space-y-2 relative border-none p-0 m-0">
        <legend className="block font-pop text-2xl text-fun-dark tracking-wide mb-2">
          Near where?
        </legend>

        <LocationSelector
          selectedLocation={preferences?.location}
          onChange={(newLocation) => {
            if (newLocation && !areLocationEquals(newLocation, preferences?.location)) {
              onLocationChange(newLocation);
            }
          }}
        />

        <DistanceRangeSelector
          selectedRange={preferences?.range}
          ranges={RANGES}
          onChange={(newDistanceRange) => {
            if (newDistanceRange && newDistanceRange.id !== preferences?.range?.id) {
              onDistanceRangeChange(newDistanceRange);
            }
          }}
        />
      </fieldset>

      <ServiceSelector
        services={services}
        selectedService={preferences?.service}
        onChange={(newService) => {
          if (newService && newService.id !== preferences?.service?.id) {
            onServiceChange(newService);
          }
        }} />
    </form>
  );
}
