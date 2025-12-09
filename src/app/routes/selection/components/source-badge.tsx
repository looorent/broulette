// TODO

export function SourceBadge({ source }: { source?: string }) {
  if (source) {
    const normalizedSource = source.toLowerCase();

    // Define styles for different providers
    let badgeStyle = "bg-gray-200 text-fun-dark"; // Default
    let label = source;

    if (normalizedSource.includes("google")) {
      badgeStyle = "bg-[#4285F4] text-white"; // Google Blue
      label = "Google";
    } else if (normalizedSource.includes("tripadvisor")) {
      badgeStyle = "bg-[#00AA6C] text-white"; // TripAdvisor Green
      label = "TripAdvisor";
    } else if (normalizedSource.includes("mapbox")) {
      badgeStyle = "bg-[#314CCD] text-white"; // Mapbox Blue
      label = "Mapbox";
    } else if (normalizedSource.includes("yelp")) {
      badgeStyle = "bg-[#FF1A1A] text-white"; // Yelp Red
      label = "Yelp";
    }

    return (
      <div className={`
        absolute bottom-3 right-3
        ${badgeStyle}
        border-[3px] border-fun-dark
        px-2.5 py-1 rounded-lg
        font-bold font-sans text-xs uppercase tracking-wider
        shadow-hard-hover
        z-20
        animate-in fade-in slide-in-from-bottom-2 duration-500
      `}>
        <span className="opacity-75 text-[10px] mr-1">via</span>
        {label}
      </div>
    );
  } else {
    return null;
  }

}
