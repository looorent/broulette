
import { forwardRef, useImperativeHandle, useRef } from "react";

import { areLocationEquals, DISTANCE_RANGES, type DistanceRangeOption, type LocationPreference, type Preference, type ServicePreference } from "@features/search";

import { DistanceRangeSelector } from "./distange-range-selector";
import { LocationSelector, type LocationSelectorHandle } from "./location-selector";
import ServiceSelector from "./service-selector";

interface PreferencesFormProps {
  services: ServicePreference[];
  preferences: Preference;
  onLocationChange: (newLocation: LocationPreference) => void;
  onDistanceRangeChange: (newDistanceRange: DistanceRangeOption) => void;
  onServiceChange: (newService: ServicePreference) => void;
}

export interface PreferencesFormHandle {
  handleClose: () => void;
}

export const PreferencesForm = forwardRef<PreferencesFormHandle, PreferencesFormProps>(
  ({ services, preferences, onLocationChange, onDistanceRangeChange, onServiceChange }, ref) => {
    const locationSelectorRef = useRef<LocationSelectorHandle>(null);
      useImperativeHandle(ref, () => ({
        handleClose: () => {
          locationSelectorRef?.current?.handleClose();
        },
      }));

      return (
        <form id="preferences-form" className="flex flex-col gap-8" onSubmit={() => false}>
          <fieldset className={`
            relative m-0 w-full max-w-full min-w-0 space-y-2 border-none p-0
          `}>
            <legend className={`
              mb-2 block font-pop text-2xl tracking-wide text-fun-dark
            `}>
              Near where?
            </legend>

            <LocationSelector
              ref={locationSelectorRef}
              selectedLocation={preferences?.location}
              onChange={(newLocation) => {
                if (newLocation && !areLocationEquals(newLocation, preferences?.location)) {
                  onLocationChange(newLocation);
                }
              }}
            />

            <DistanceRangeSelector
              selectedRange={preferences?.range}
              ranges={DISTANCE_RANGES}
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
);

PreferencesForm.displayName = "PreferencesForm";
