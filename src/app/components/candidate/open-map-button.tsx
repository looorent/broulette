import { Navigation } from "lucide-react";

export function OpenMapButton({ mapUrl } : {
  mapUrl: string | undefined | null;
}) {
  if (mapUrl && mapUrl?.length > 0) {
    return (
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="
          flex flex-1 items-center justify-center
          bg-fun-green
          border-4 border-fun-dark rounded-2xl
          py-4
          shadow-hard
          gap-2
          transition-transform active:translate-y-1 active:shadow-none hover:brightness-110 cursor-pointer
        "
      >
        <span className="font-pop text-2xl text-fun-dark uppercase tracking-wide">Let's Eat!</span>
        <Navigation className="w-6 h-6 stroke-[3px] text-fun-dark" />
      </a>
    )
  } else {
    return null;
  }
}
