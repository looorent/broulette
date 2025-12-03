import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useFetcher, useLoaderData, useSearchParams, type ClientLoaderFunctionArgs } from "react-router";
import FoodRain from "~/components/food-rain";
import HelpButton from "~/components/help-button";
import LoadingSpinner from "~/components/loading/loading-spinner";
import { LoadingTitle } from "~/components/loading/loading-title";
import { PreferenceChip } from "~/components/preferences/preferences-chip";
import { PreferencesForm } from "~/components/preferences/preferences-modal";
import BrandTitle from "~/components/home/brand-title";
import { getBrowserLocation } from "~/functions/geolocation";
import { RANGES } from "~/types/distance";
import { createDeviceLocation, type Coordinates } from "~/types/location";
import { createDefaultPreference, type Preference } from "~/types/preference";
import { createNextServices, type ServicePreference } from "~/types/service";
import StartButton, { SEARCH_FETCHER } from "~/components/home/start-button";
import { BottomSheet } from "~/components/bottom-sheet-modal";

interface LoaderData {
  services: ServicePreference[];
  deviceCoordinates: Coordinates | null;
}

export async function clientLoader({ request }: ClientLoaderFunctionArgs): Promise<LoaderData> {
  const services = createNextServices(new Date());
  try {
    const position = await getBrowserLocation();
    return {
      services: services,
      deviceCoordinates: position?.coords
    };
  } catch (error) {
    console.warn("Location access denied or failed:", error);
    return {
      services: services,
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
    const { services, deviceCoordinates } = useLoaderData<typeof clientLoader>();
    const [preferences, setPreferences] = useState(createDefaultPreference(services, RANGES, null)); // TODO is it possible to load navigation data here? in initialization?

    // TODO test
    useEffect(() => {
      if (deviceCoordinates) {
        setPreferences(previous => previous.withLocation(createDeviceLocation(deviceCoordinates)));
      }
    }, [deviceCoordinates]);

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
            onUpdate={(newPreferences: Preference) => {
              setPreferences(newPreferences);
              // TODO Update the hidden form used for base HTML
            }} />
        </BottomSheet>


        <FoodRain />

        <section className="h-full flex flex-col justify-between pt-14"
          aria-label="Welcome Screen">
          <BrandTitle />

          <StartButton preferences={preferences} />

          <NavLink to="?modal=preferences">
            <PreferenceChip preferences={preferences} onOpen={() => {
              searchParams.set("modal", "preferences");
              setSearchParams(searchParams);
            }} />
          </NavLink>
        </section>
      </main>
    );
  }
}
