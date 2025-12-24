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
        flex items-center font-pop gap-2 pb-2 px-2 text-sm uppercase tracking-wide transition-all duration-200
        border-b-2
        cursor-pointer
        ${activeTab === id
          ? "border-fun-dark text-fun-dark"
          : "border-transparent text-fun-dark/40 hover:text-fun-dark hover:border-fun-dark/20"
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
