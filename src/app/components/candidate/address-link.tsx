import { MapPin } from "lucide-react";

export function AddressLink({ formattedAddress, mapUrl }: { formattedAddress: string | null | undefined, mapUrl: string | null | undefined }) {
  return (
    formattedAddress && formattedAddress.length > 0 ? (
      <div id="candidate-address" className="flex items-center gap-2">
        <MapPin className="h-5 w-5 shrink-0 text-fun-red" />
        {mapUrl && mapUrl?.length > 0 ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              max-w-fit cursor-pointer truncate whitespace-nowrap decoration-2
              hover:underline
            `}
          >
            {formattedAddress}
          </a>
        ) : formattedAddress}
      </div>
    ) : null
  );
}
