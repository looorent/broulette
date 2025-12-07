import { useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData, useSearchParams, type ClientLoaderFunctionArgs, type ShouldRevalidateFunction } from "react-router";
import { AlertBox } from "~/components/alert-box";
import { BottomSheet } from "~/components/bottom-sheet-modal";
import LoadingSpinner from "~/components/loading/loading-spinner";
import { LoadingTitle } from "~/components/loading/loading-title";
import { getBrowserLocation } from "~/functions/address/browser-location";
import { PreferenceChip, type PreferenceChipHandle } from "~/routes/home/components/preferences/preferences-chip";
import { PreferencesForm, type PreferencesFormHandle } from "~/routes/home/components/preferences/preferences-form";
import { RANGES } from "~/types/distance";
import { createDeviceLocation } from "~/types/location";
import { createDefaultPreference, Preference } from "~/types/preference";
import { createNextServices, type ServicePreference } from "~/types/service";
import BrandTitle from "./components/brand-title";
import FoodRain from "./components/food-rain";
import HelpButton from "./components/help-button";
import HelpModal from "./components/help-modal";
import StartButton, { SEARCH_FETCHER } from "./components/start-button";
import { HomeProvider, useHomeContext } from "./context";

interface LoaderData {
  services: ServicePreference[];
  defaultPreferences: Preference;
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
  return {
    services: services,
    defaultPreferences: createDefaultPreference(services, RANGES, null)
  };
}

function HomeContent() {
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
    const { isAlertOpen, closeAlert, alertOptions } = useHomeContext();

    useEffect(() => {
      async function fetchLocation() {
        try {
          const devicePosition = await getBrowserLocation();
          if (devicePosition?.coords) {
            setPreferences((prev) => prev.withLocation(createDeviceLocation(devicePosition.coords)));
          }
        } catch (error) {
          console.warn("Location access denied or failed:", error);
        }
      }

      if (!preferences.isValid()) {
        fetchLocation();
      }
    }, []);

    return (
      <main className="h-full relative">
        <HelpButton onOpen={() => {
          setSearchParams(previous => {
            previous.set("modal", "help");
            return previous;
          });
        }} />

        <section
          className="h-full flex flex-col justify-between pt-14"
          aria-label="Welcome Screen">
          <BrandTitle />

          <StartButton
            preferences={preferences}
            onBuzzOnError={() => preferenceChipRef?.current?.handleBuzzOnLocationError?.()} />

          <PreferenceChip
            ref={preferenceChipRef}
            preferences={preferences}
            onOpen={() => {
              setSearchParams(previous => {
                previous.set("modal", "preferences");
                return previous;
              });
            }
            } />
        </section>

        <FoodRain />

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

        <AlertBox
          isOpen={isAlertOpen}
          onClose={closeAlert}
          title={alertOptions?.title}
          variant={alertOptions?.variant}
          actions={alertOptions?.actions}
          className={alertOptions?.className}
        >
          {alertOptions?.children}
        </AlertBox>

        <HelpModal
          isOpen={searchParams.get("modal") === "help"}
          onClose={() => {
            searchParams.delete("modal");
            setSearchParams(searchParams);
          }}
        />
      </main>
    );
  }
}

export default function Home() {
  return (
    <HomeProvider>
      <HomeContent></HomeContent>
    </HomeProvider>
  );
}
