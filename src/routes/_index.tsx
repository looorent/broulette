import { useEffect, useRef, useState } from "react";
import { useLoaderData, useSearchParams } from "react-router";

import { AlertBox, AlertProvider, useAlertContext } from "@components/alert";
import { BottomSheet } from "@components/bottom-sheet-modal";
import { BrandTitle } from "@components/brand";
import { HelpButton, HelpModal } from "@components/help";
import { SearchSubmitButton } from "@components/search";
import { PreferenceChip, type PreferenceChipHandle } from "@components/search-preference";
import { PreferencesForm, type PreferencesFormHandle } from "@components/search-preference-form";
import { APP_CONFIG } from "@config/server";
import { getDeviceLocation, getGeolocationPermissionStatus } from "@features/browser.client";
import { createDeviceLocation, createNextServices, DISTANCE_RANGES, preferenceFactory, type LocationPreference, type Preference } from "@features/search";
import { logger } from "@features/utils/logger";

export async function loader() {
  const services = createNextServices(new Date());
  return {
    services: services,
    defaultPreferences: preferenceFactory.createDefaultPreference(services, DISTANCE_RANGES, null),
    configuration: APP_CONFIG
  } as const;
}

async function fetchLocation(): Promise<LocationPreference | undefined> {
  try {
    const devicePosition = await getDeviceLocation();
    if (devicePosition?.coords) {
      return createDeviceLocation(devicePosition.coords);
    } else {
      return undefined;
    }
  } catch (error) {
    logger.warn("Location access denied or failed:", error);
    return undefined;
  }
}

function HomeContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { services, defaultPreferences, configuration } = useLoaderData<typeof loader>();
  const [preferences, setPreferences] = useState<Preference>(defaultPreferences);
  const preferenceFormRef = useRef<PreferencesFormHandle>(null);
  const preferenceChipRef = useRef<PreferenceChipHandle>(null);
  const { isAlertOpen, closeAlert, alertOptions } = useAlertContext();

  useEffect(() => {
    const needsLocation = !preferences.location.coordinates && !preferences.isDeviceLocationAttempted;
    if (needsLocation) {
      let isMounted = true;
      const initializeLocation = async () => {
        const permission = await getGeolocationPermissionStatus();
        if (permission === "denied") {
          setPreferences((prev) => preferenceFactory.withDeviceLocationAttempted(prev));
        } else {
          const newLocation = await fetchLocation();
          if (isMounted && newLocation) {
            setPreferences((prev) => {
              const current = preferenceFactory.withLocation(prev, newLocation);
              return preferenceFactory.withDeviceLocationAttempted(current);
            });
          } else {
            setPreferences((prev) => preferenceFactory.withDeviceLocationAttempted(prev));
          }
        }
      };
      initializeLocation();
      return () => { isMounted = false; };
    } else {
      return undefined;
    }
  }, [preferences?.id, preferences?.location?.coordinates, preferences.isDeviceLocationAttempted]);

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
    <main className="relative h-full">
      <HelpButton onOpen={() => {
        setSearchParams(previous => {
          const newParams = new URLSearchParams(previous);
          newParams.set("modal", "help");
          return newParams;
        });
      }} />

      <section
        className="flex h-full flex-col justify-between pt-14"
        aria-label="Welcome Screen">
        <BrandTitle />

        <SearchSubmitButton
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
          onServiceChange={newService => setPreferences(preferenceFactory.withService(preferences, newService))}
          onDistanceRangeChange={newDistanceRange => setPreferences(preferenceFactory.withRange(preferences, newDistanceRange)) }
          onLocationChange={newLocation => setPreferences(preferenceFactory.withLocation(preferences, newLocation)) }
          onAvoidFastFoodChange={value => setPreferences(preferenceFactory.withAvoidFastFood(preferences, value))} />
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
        configuration={configuration}
        isOpen={searchParams.get("modal") === "help"}
        onClose={closeModal}
      />
    </main>
  );
}

export default function Home() {
  return (
    <AlertProvider>
      <HomeContent></HomeContent>
    </AlertProvider>
  );
}
