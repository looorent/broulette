
import { Hamburger, ShoppingBag } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef } from "react";

import { areLocationEquals, DISTANCE_RANGES, type DistanceRangeOption, type LocationPreference, type Preference, type ServicePreference } from "@features/search";

import { DistanceRangeSelector } from "./distance-range-selector";
import { LocationSelector, type LocationSelectorHandle } from "./location-selector";
import ServiceSelector from "./service-selector";
import { ToggleSelector } from "./toggle-selector";

interface PreferencesFormProps {
  services: ServicePreference[];
  preferences: Preference;
  onLocationChange: (newLocation: LocationPreference) => void;
  onDistanceRangeChange: (newDistanceRange: DistanceRangeOption) => void;
  onServiceChange: (newService: ServicePreference) => void;
  onAvoidFastFoodChange: (value: boolean) => void;
  onAvoidTakeawayChange: (value: boolean) => void;
}

export interface PreferencesFormHandle {
  handleClose: () => void;
}

export const PreferencesForm = forwardRef<PreferencesFormHandle, PreferencesFormProps>(
  ({ services, preferences, onLocationChange, onDistanceRangeChange, onServiceChange, onAvoidFastFoodChange, onAvoidTakeawayChange }, ref) => {
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

          <fieldset className={`
            relative m-0 flex w-full max-w-full min-w-0 flex-col gap-1 space-y-3
            border-none p-0
          `}>
            <legend className={`
              block font-pop text-2xl tracking-wide text-fun-dark
            `}>
              Picky?
            </legend>

            <ToggleSelector
              label="Avoid fast food"
              checked={preferences?.avoidFastFood ?? true}
              onChange={onAvoidFastFoodChange}
              icon={Hamburger}
            />

            <ToggleSelector
              label="Avoid takeaway"
              checked={preferences?.avoidTakeaway ?? true}
              onChange={onAvoidTakeawayChange}
              icon={ShoppingBag}
            />
          </fieldset>
        </form>
      );
  }
);

PreferencesForm.displayName = "PreferencesForm";
