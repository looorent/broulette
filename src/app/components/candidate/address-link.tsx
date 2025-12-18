import { MapPin } from "lucide-react";

export function AddressLink({ formattedAddress, mapUrl }: { formattedAddress: string | null | undefined, mapUrl: string | null | undefined }) {
  return (
    formattedAddress && formattedAddress.length > 0 ? (
      <div id="candidate-address" className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-fun-red shrink-0" />
        {mapUrl && mapUrl?.length > 0 ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline decoration-2 cursor-pointer"
          >
            {formattedAddress}
          </a>
        ) : formattedAddress}
      </div>
    ) : null
  );
}
