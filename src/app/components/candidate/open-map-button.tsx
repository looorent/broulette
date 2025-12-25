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
        className={`
          flex flex-1 cursor-pointer items-center justify-center gap-2
          rounded-2xl border-4 border-fun-dark bg-fun-green py-4 shadow-hard
          transition-transform
          hover:brightness-110
          active:translate-y-1 active:shadow-none
        `}
      >
        <span className={`
          font-pop text-2xl tracking-wide text-fun-dark uppercase
        `}>Let's Eat!</span>
        <Navigation className="h-6 w-6 stroke-[3px] text-fun-dark" />
      </a>
    )
  } else {
    return null;
  }
}
