import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useFetcher, useLoaderData, useSearchParams, type ClientLoaderFunctionArgs } from "react-router";
import FoodRain from "~/components/food-rain";
import LoadingSpinner from "~/components/loading-spinner";
import { LoadingTitle } from "~/components/loading-title";
import { PreferenceChip } from "~/components/preferences-chip";
import { PreferencesModal } from "~/components/preferences-modal";
import { getBrowserLocation } from "~/functions/geolocation";
import { RANGES } from "~/types/distance";
import { createDeviceLocation, type Coordinates } from "~/types/location";
import { createDefaultPreference, type Preference } from "~/types/preference";
import { createNextServices, type ServicePreference } from "~/types/service";

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
  const fetcher = useFetcher();

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
        <button
          className="absolute
            top-5
            right-5
            bg-fun-cream
            text-fun-dark
            border-[3px]
            border-fun-dark
            rounded-full
            p-2
            shadow-hard-hover hover:scale-110 active:scale-95 transition-transform group"
          title="Get Help"
          aria-label="Get Help"
          onClick={() => alert('Help is coming! Just follow the big buttons for now.')}>
          <HelpCircle />
        </button>

        <PreferencesModal isOpen={searchParams.get("modal") === "preferences"}
          preferences={preferences}
          services={services}
          onClosed={() => {
            searchParams.delete("modal");
            setSearchParams(searchParams);
          }}
          onUpdate={(newPreferences: Preference) => {
            setPreferences(newPreferences);
            // TODO Update the hidden form used for base HTML
          }} />

        <FoodRain />

        <section className="h-full flex flex-col justify-between pt-14"
          aria-label="Welcome Screen">
          <header className="text-center relative animate-float">
            <h1 className="font-display text-6xl sm:text-7xl leading-[0.9] text-white drop-shadow-[5px_5px_0px_rgba(45,52,54,1)] tracking-tighter mb-4 flex flex-col items-center">
              <span className="transform -rotate-6 transition hover:rotate-0 duration-300">TOO</span>
              <span className="transform rotate-3 transition hover:rotate-0 duration-300 text-fun-yellow">LAZY</span>
              <span className="transform -rotate-2 transition hover:rotate-0 duration-300">TO</span>
              <span className="transform rotate-6 transition hover:rotate-0 duration-300">PICK?</span>
            </h1>
            <div className="inline-block bg-fun-dark text-fun-cream px-4 py-2 rounded-full transform -rotate-2 mt-4 shadow-hard-white">
              <p className="font-bold tracking-widest uppercase text-sm">We choose, you eat.</p>
            </div>
          </header>

          <fetcher.Form method="post"
            action="/searches"
            className="w-full flex justify-center items-center mb-14 mt-auto">
            <div className="absolute w-56 h-56 bg-fun-cream/30 rounded-full animate-pulse-mega pointer-events-none z-0" aria-hidden="true"></div>

            <button className="group relative w-48 h-48 bg-fun-cream rounded-full border-[6px] border-fun-dark shadow-hard transition-all duration-200 hover:translate-y-0.5 hover:shadow-hard-hover active:scale-95 flex flex-col items-center justify-center gap-2 z-20 cursor-pointer"
              type="submit">
              <span className="font-pop text-4xl uppercase tracking-wider text-fun-dark">
                feed me
              </span>
            </button>
          </fetcher.Form>

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
