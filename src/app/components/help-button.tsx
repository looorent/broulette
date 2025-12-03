import { HelpCircle } from "lucide-react";

export default function HelpButton() {
  return (
    <button
      className="absolute
        top-5
        right-5
        bg-fun-cream
        text-fun-dark
        border-[3px]
        border-fun-dark
        rounded-full
        p-2
        shadow-hard-hover hover:scale-110 active:scale-95 transition-transform group"
      title="Get Help"
      aria-label="Get Help"
      onClick={() => alert('Help is coming! Just follow the big buttons for now.')}>
      <HelpCircle />
    </button>
  );
}
