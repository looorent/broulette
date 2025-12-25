import { HelpCircle } from "lucide-react";

interface HelpButtonProps {
  onOpen: () => void;
}

export function HelpButton({ onOpen }: HelpButtonProps) {
  return (
    <button
      className={`
        absolute top-5 right-5 cursor-pointer rounded-full border-3
        border-fun-dark bg-fun-cream p-2 text-fun-dark shadow-hard-hover
        transition-transform
        hover:scale-110
        active:scale-95
      `}
      title="Get Help"
      aria-label="Get Help"
      onClick={onOpen}>
      <HelpCircle />
    </button>
  );
}
