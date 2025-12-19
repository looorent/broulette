interface SourceBadgeStyle {
  style: string;
  label: string;
}

function defineStyle(source: string): SourceBadgeStyle {
  switch(source?.toLowerCase()) {
    case "google":
    case "google_place":
      return {
        style: "bg-fun-blue text-white",
        label: "Google"
      };
    case "tripadvisor":
      return {
        style: "bg-fun-green text-white",
        label: "TripAdvisor"
      };
    case "mapbox":
      return {
        style: "bg-fun-blue text-white",
        label: "MapBox"
      };
    case "yelp":
      return {
        style: "bg-fun-red text-white",
        label: "Yelp"
      };
    case "osm":
      return {
        style: "bg-[#654321] text-white",
        label: "OpenStreetMap"
      };
    default:
      return {
        style: "bg-fun-red text-white",
        label: source
      };
  }
}

export function SourceBadge({ source }: { source?: string }) {
  if (source && source.length > 0) {
    const style = defineStyle(source);
    return (
      <div className={`
        absolute bottom-3 right-3
        ${style.style}
        border-[3px] border-fun-dark
        px-2.5 py-1 rounded-lg
        font-bold font-sans text-xs uppercase tracking-wider
        shadow-hard-hover
        z-20
        animate-in fade-in slide-in-from-bottom-2 duration-500
      `}>
        <span className="opacity-75 text-[10px] mr-1">via</span>
        {style.label}
      </div>
    );
  } else {
    return null;
  }
}
