import { useState } from "react";
import { NavLink, useFetcher, useLoaderData, useSearchParams, type ClientLoaderFunctionArgs, type ShouldRevalidateFunction } from "react-router";
import { BottomSheet } from "~/components/bottom-sheet-modal";
import FoodRain from "~/components/food-rain";
import HelpButton from "~/components/help-button";
import BrandTitle from "~/components/home/brand-title";
import StartButton, { SEARCH_FETCHER } from "~/components/home/start-button";
import LoadingSpinner from "~/components/loading/loading-spinner";
import { LoadingTitle } from "~/components/loading/loading-title";
import { PreferenceChip } from "~/components/preferences/preferences-chip";
import { PreferencesForm } from "~/components/preferences/preferences-form";
import { getBrowserLocation } from "~/functions/geolocation";
import { RANGES, type DistanceRange } from "~/types/distance";
import { LocationPreference, type Coordinates } from "~/types/location";
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

    return (
      <main className="h-full relative">
        <HelpButton />

        <BottomSheet
          isOpen={searchParams.get("modal") === "preferences"}
          onClose={() => {
            searchParams.delete("modal");
            setSearchParams(searchParams);
          }}
          title="Preferences"
        >
          <PreferencesForm
            preferences={preferences}
            services={services}
            onServiceChange={(newService: ServicePreference) => {
              setPreferences(preferences.withService(newService));
              // TODO Update the hidden form used for base HTML
            }}
            onDistanceRangeChange={(newDistanceRange: DistanceRange) => {
              setPreferences(preferences.withRange(newDistanceRange));
              // TODO Update the hidden form used for base HTML
            }}
            onLocationChange={(newLocation: LocationPreference) => {
              setPreferences(preferences.withLocation(newLocation));
              // TODO Update the hidden form used for base HTML
            }} />
        </BottomSheet>

        <FoodRain />

        <section
          className="h-full flex flex-col justify-between pt-14"
          aria-label="Welcome Screen">
          <BrandTitle />

          <StartButton preferences={preferences} />

          <PreferenceChip preferences={preferences} onOpen={() => {
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
