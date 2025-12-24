
import { SiGoogle, SiTripadvisor, type IconType } from "@icons-pack/react-simple-icons";

interface SourceBadgeStyle {
  style: string;
  label: string;
  icon?: IconType | undefined;
}

function defineStyle(source: string): SourceBadgeStyle {
  switch(source?.toLowerCase()) {
    case "google":
    case "google_place":
      return {
        style: "bg-fun-blue text-fun-cream",
        label: "Google",
        icon: SiGoogle,
      };
    case "tripadvisor":
      return {
        style: "bg-fun-green text-fun-cream",
        label: "TripAdvisor",
        icon: SiTripadvisor
      };
    case "osm":
      return {
        style: "bg-[#654321] text-fun-cream",
        label: "OpenStreetMap",
        icon: undefined
      };
    default:
      return {
        style: "bg-fun-red text-fun-cream",
        label: source
      };
  }
}

interface SourceBadgeProps {
  source?: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  if (source && source.length > 0) {
    const style = defineStyle(source);
    const Icon = style.icon;
    return (
      <div className={`
        absolute bottom-3 right-3
        inline-flex items-center justify-center
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
        {Icon && <Icon className="h-3" /> }
      </div>
    );
  } else {
    return null;
  }
}
