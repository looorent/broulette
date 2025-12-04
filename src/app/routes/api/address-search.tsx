import type { LocationPreference } from "~/types/location";
import type { Route } from "../+types/address-suggestion";
import type { ActionFunctionArgs } from "react-router";

interface OverpassLocation {
  place_id: number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

function convertOverpassLocationToSuggestion(overpassLocation: OverpassLocation): LocationPreference {
  return {
    label: {
      display: overpassLocation.display_name,
      compact: overpassLocation.name
    },
    coordinates: {
      latitude: Number(overpassLocation.lat),
      longitude: Number(overpassLocation.lon)
    },
    isDeviceLocation: false
  };
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", { status: 405 });
  }

  const formData = await request.formData();
  const query = formData.get("query");

  if (query && typeof query === "string" && query.length > 1) {
    try {
      const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}format=json&limit=5&addressdetails=1&extratags=0&namedetails=0&polygon_geojson=0&bounded=0`;

      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "BiteRoulette/1.0" // TODO
        },
      });

      if (response.ok) {
        const data: OverpassLocation[] = await response.json();
        return {
          locations: data.filter(Boolean).map(convertOverpassLocationToSuggestion)
        };
      } else {
        console.log("Error when looking for address:", response.status, response.body);
        throw new Error("API failed"); // TODO manage this
      }
    } catch (error) {
      console.error(error);
      // TODO
      throw new Response("Failed to fetch addresses", { status: 500 });
    }
  }
}
