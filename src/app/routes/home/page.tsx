import { useEffect, useRef, useState } from "react";
import { useLoaderData, useSearchParams, type ClientLoaderFunctionArgs, type ShouldRevalidateFunction } from "react-router";
import { AlertBox } from "~/components/alert-box";
import { BottomSheet } from "~/components/bottom-sheet-modal";
import { getBrowserLocation } from "~/functions/address/browser-location.client";
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
import StartButton from "./components/start-button";
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
          setPreferences((prev) => prev.withLocation(createDeviceLocation(devicePosition.coords)).withDeviceLocationAttempted());
        }
      } catch (error) {
        console.warn("Location access denied or failed:", error);
        setPreferences((prev) => prev.withDeviceLocationAttempted());
      }
    }

    if (!preferences.isValid()) {
      fetchLocation();
    }
  }, []);

  const closeModal = () => {
    setSearchParams(previous => {
      const newParams = new URLSearchParams(previous);
      newParams.delete("modal");
      return newParams;
    }, {
      replace: true
    });
  };

  return (
    <main className="h-full relative">
      <HelpButton onOpen={() => {
        setSearchParams(previous => {
          const newParams = new URLSearchParams(previous);
          newParams.set("modal", "help");
          return newParams;
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
              const newParams = new URLSearchParams(previous);
              newParams.set("modal", "preferences");
              return newParams;
            });
          }
          } />
      </section>

      <FoodRain />

      <BottomSheet
        isOpen={searchParams.get("modal") === "preferences"}
        onClose={() => {
          preferenceFormRef?.current?.handleClose();
          closeModal();
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
        onClose={closeModal}
      />
    </main>
  );
}

export default function Home() {
  return (
    <HomeProvider>
      <HomeContent></HomeContent>
    </HomeProvider>
  );
}
