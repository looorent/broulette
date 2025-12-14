import { HelpCircle } from "lucide-react";

interface HelpButtonProps {
  onOpen: () => void;
}

export function HelpButton({ onOpen }: HelpButtonProps) {
  return (
    <button
      className="
        absolute top-5 right-5
        bg-fun-cream
        text-fun-dark
        border-3 border-fun-dark rounded-full
        p-2
        shadow-hard-hover hover:scale-110 active:scale-95 transition-transform
        cursor-pointer
        "
      title="Get Help"
      aria-label="Get Help"
      onClick={onOpen}>
      <HelpCircle />
    </button>
  );
}
