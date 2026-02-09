import type { LucideIcon } from "lucide-react";

interface ToggleSelectorProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon?: LucideIcon;
}

export function ToggleSelector({ label, checked, onChange, icon: Icon }: ToggleSelectorProps) {
  return (
    <label className="group mr-1 cursor-pointer" aria-label={label}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <div className={`
        flex items-center justify-between rounded-2xl border-4
        border-fun-dark/10 bg-white px-5 py-3 transition-all
        group-hover:border-fun-dark/30
        peer-checked:border-fun-dark peer-checked:bg-fun-yellow
        peer-checked:shadow-hard
      `}>
        <span className={`
          flex items-center gap-2 font-sans text-base font-bold tracking-tight
          text-fun-dark uppercase
        `}>
          {Icon && <Icon className="h-5 w-5 stroke-[2.5px]" />}
          {label}
        </span>

        <div className={`
          relative h-7 w-12 shrink-0 rounded-full border-2 transition-all
          ${checked
            ? "border-fun-dark bg-fun-green"
            : "border-fun-dark/20 bg-fun-dark/10"
          }
        `}>
          <div className={`
            absolute top-0.5 h-5 w-5 rounded-full border-2 bg-white
            transition-all
            ${checked
              ? "left-[calc(100%-1.375rem)] border-fun-dark"
              : "left-0.5 border-fun-dark/20"
            }
          `} />
        </div>
      </div>
    </label>
  );
}
