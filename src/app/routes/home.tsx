import { useRef, useState } from "react";
import { useFetcher, useLoaderData, useSearchParams, type ClientLoaderFunctionArgs, type ShouldRevalidateFunction } from "react-router";
import { BottomSheet } from "~/components/bottom-sheet-modal";
import FoodRain from "~/components/home/food-rain";
import HelpButton from "~/components/home/help-button";
import BrandTitle from "~/components/home/brand-title";
import StartButton, { SEARCH_FETCHER } from "~/components/home/start-button";
import LoadingSpinner from "~/components/loading/loading-spinner";
import { LoadingTitle } from "~/components/loading/loading-title";
import { PreferenceChip, type PreferenceChipHandle } from "~/components/preferences/preferences-chip";
import { PreferencesForm, type PreferencesFormHandle } from "~/components/preferences/preferences-form";
import { getBrowserLocation } from "~/functions/address/browser-location";
import { RANGES, type DistanceRange } from "~/types/distance";
import { type Coordinates, type LocationPreference } from "~/types/location";
import { createDefaultPreference, Preference } from "~/types/preference";
import { createNextServices, type ServicePreference } from "~/types/service";

interface LoaderData {
  services: ServicePreference[];
  defaultPreferences: Preference;
  deviceCoordinates: Coordinates | null;
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}) => {
  const isModalChange = currentUrl.searchParams.get("modal") !== nextUrl.searchParams.get("modal");
  return !isModalChange && defaultShouldRevalidate;
};

export async function clientLoader({ request }: ClientLoaderFunctionArgs): Promise<LoaderData> {
  const services = createNextServices(new Date());
  try {
    const position = await getBrowserLocation();
    return {
      services: services,
      defaultPreferences: createDefaultPreference(services, RANGES, position?.coords),
      deviceCoordinates: position?.coords
    };
  } catch (error) {
    console.warn("Location access denied or failed:", error);
    return {
      services: services,
      defaultPreferences: createDefaultPreference(services, RANGES, null),
      deviceCoordinates: null
    };
  }
}

export default function Home() {
  const fetcher = useFetcher({ key: SEARCH_FETCHER });

  if (fetcher.state !== "idle") {
    return (
      <main className="h-full relative flex flex-col items-center justify-center gap-10">
        <LoadingSpinner />
        <LoadingTitle />
      </main>
    );
  } else {
    const [searchParams, setSearchParams] = useSearchParams();
    const { services, defaultPreferences } = useLoaderData<typeof clientLoader>();
    const [preferences, setPreferences] = useState<Preference>(defaultPreferences);
    const preferenceFormRef = useRef<PreferencesFormHandle>(null);
    const preferenceChipRef = useRef<PreferenceChipHandle>(null);

    return (
      <main className="h-full relative">
        <HelpButton />

        <BottomSheet
          isOpen={searchParams.get("modal") === "preferences"}
          onClose={() => {
            preferenceFormRef?.current?.handleClose();
            searchParams.delete("modal");
            setSearchParams(searchParams);

          }}
          title="Preferences"
        >
          <PreferencesForm
            ref={preferenceFormRef}
            preferences={preferences}
            services={services}
            onServiceChange={newService => setPreferences(preferences.withService(newService))}
            onDistanceRangeChange={newDistanceRange => setPreferences(preferences.withRange(newDistanceRange))}
            onLocationChange={newLocation => setPreferences(preferences.withLocation(newLocation))} />
        </BottomSheet>

        <FoodRain />

        <section
          className="h-full flex flex-col justify-between pt-14"
          aria-label="Welcome Screen">
          <BrandTitle />

          <StartButton
            preferences={preferences}
            onBuzzOnError={() => preferenceChipRef?.current?.handleBuzzOnLocationError?.()}/>

          <PreferenceChip
            ref={preferenceChipRef}
            preferences={preferences}
            onOpen={() => {
            setSearchParams(previous => {
              previous.set("modal", "preferences");
              return previous;
            });
          }} />
        </section>
      </main>
    );
  }
}
