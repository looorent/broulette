import type { LucideProps } from "lucide-react";
import type { ReactNode } from "react";

interface PreferenceChipValueProps {
  label: string;
  icon?: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  className?: string;
  isValid?: boolean;
  isBuzzing?: boolean;
}

export function PreferenceChipValue({
  icon,
  label,
  className = "",
  isValid = true,
  isBuzzing = false,
}: PreferenceChipValueProps) {
  const Icon = icon;
  return (
    <div className="relative group/tag">
      <div className={`
        flex items-center gap-1.5 px-3 py-1
        border-2 shadow-none rounded-md
        transition-all duration-200 ease-spring
        cursor-pointer
        ${isValid ? "bg-fun-cream hover:rotate-0" : ""}
        ${!isValid ? "bg-fun-cream text-fun-red hover:translate-y-0.5 hover:shadow-hard-hover active:scale-95 border-dashed hover:bg-slate-200" : ""}
        ${isBuzzing ? 'animate-buzz' : ''}
        ${className}
      `}>
        { Icon ? (
          <Icon className="w-4 h-4" />
        ) : null}

        <span className="font-bold text-sm uppercase tracking-wide whitespace-nowrap truncate max-w-32">
          {label}
        </span>

        {!isValid && (
          <span className={`
            absolute -top-1 -right-1
            w-3 h-3
            bg-fun-red rounded-full border-2 border-fun-cream
            ${isBuzzing ? 'animate-buzz' : ''}
          `} />
        )}
      </div>
    </div>
  );
}
