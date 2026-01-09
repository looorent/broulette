import type { LucideIcon } from "lucide-react";

export type TabType = "about" | "privacy" | "legal";

interface TabButtonProps {
  id: TabType;
  label: string;
  icon: LucideIcon;
  activeTab: TabType;
  onSelected: (tab: TabType) => void;
}

export function TabButton({ id, label, icon: Icon, activeTab, onSelected }: TabButtonProps) {
  return (
    <button
      onClick={() => onSelected?.(id)}
      className={`
        flex cursor-pointer items-center gap-2 border-b-2 px-2 pb-2 font-pop
        text-sm tracking-wide uppercase transition-all duration-200
        ${activeTab === id
          ? "border-fun-dark text-fun-dark"
          : `
            border-transparent text-fun-dark/40
            hover:border-fun-dark/20 hover:text-fun-dark
          `
        }
      `}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
