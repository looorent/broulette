import type { LucideProps } from "lucide-react";

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
    <div className="group/tag relative">
      <div className={`
        flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3 py-1
        shadow-none transition-all duration-200
        ${isValid ? `
          bg-fun-cream
          hover:rotate-0
        ` : ""}
        ${!isValid ? `
          border-dashed bg-fun-cream text-fun-red
          hover:translate-y-0.5 hover:bg-slate-200 hover:shadow-hard-hover
          active:scale-95
        ` : ""}
        ${isBuzzing ? 'animate-buzz' : ''}
        ${className}
      `}>
        { Icon ? (
          <Icon className="h-4 w-4" />
        ) : null}

        <span className={`
          max-w-32 truncate text-sm font-bold tracking-wide whitespace-nowrap
          uppercase
        `}>
          {label}
        </span>

        {!isValid && (
          <span className={`
            absolute -top-1 -right-1 h-3 w-3 rounded-full border-2
            border-fun-cream bg-fun-red
            ${isBuzzing ? 'animate-buzz' : ''}
          `} />
        )}
      </div>
    </div>
  );
}
