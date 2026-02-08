import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PreferenceChipValueProps {
  label?: string | undefined;
  className?: string;
  iconClassName?: string;
  isValid?: boolean;
  isBuzzing?: boolean;
  icon?: LucideIcon | undefined;
  children?: ReactNode;
}

export function PreferenceChipValue({
  icon: Icon,
  label,
  className = "",
  iconClassName = "h-4 w-4",
  isValid = true,
  isBuzzing = false,
  children,
}: PreferenceChipValueProps) {
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
        { children ? children : Icon ? (
          <Icon className={iconClassName} />
        ) : null}

        { label ? (
          <span className={`
            max-w-32 truncate text-sm font-bold tracking-wide whitespace-nowrap
            uppercase
          `}>
            {label}
          </span>
        ) : null }

        {!isValid && (
          <span className={`
            absolute -top-1 -right-1 h-3 w-3 rounded-full border-2
            border-fun-cream bg-fun-red
            ${isBuzzing ? "animate-buzz" : ""}
          `} />
        )}
      </div>
    </div>
  );
}
