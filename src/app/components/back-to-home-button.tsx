import { ArrowLeft } from "lucide-react";

interface BackToHomeButtonProps {
  className?: string;
}

export function BackToHomeButton({
  className = ""
}: BackToHomeButtonProps) {
  return (
    <a
      href="/"
      aria-label="Back to Lobby"
      className={`
        fixed z-100 top-4 right-4

        flex items-center gap-2 justify-center
        px-2 py-2

        bg-fun-cream/95 backdrop-blur-md
        border-[3px] border-fun-dark rounded-md shadow-hard-hover
        text-fun-dark font-bold font-pop uppercase text-sm tracking-wide

        animate-slide-in-from-top-right

        cursor-pointer transition-transform duration-500
        hover:rotate-0 hover:brightness-115 active:scale-120

        ${className}
      `}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Lobby</span>
    </a>
  );
}
