import { TriangleAlert } from "lucide-react";

interface WarningTagProps {
  label?: string;
  className?: string;
}

export function WarningTag({
  label = "",
  className = ""
}: WarningTagProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        px-3 py-1.5
        bg-fun-yellow text-fun-dark
        border-2 border-fun-dark
        rounded-lg
        shadow-hard-hover
        transform -rotate-1
        font-bold font-sans text-sm uppercase tracking-wide
        select-none
        ${className}
      `}
      role="alert"
    >
      <TriangleAlert className="w-4 h-4 stroke-[2.5px]" />
      <span>{label}</span>
    </div>
  );
}
