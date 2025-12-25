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
        fixed top-4 right-4 z-100 flex animate-slide-in-from-top-right
        cursor-pointer items-center justify-center gap-2 rounded-md border-[3px]
        border-fun-dark bg-fun-cream/95 px-2 py-2 font-pop text-sm font-bold
        tracking-wide text-fun-dark uppercase shadow-hard-hover backdrop-blur-md
        transition-transform duration-500
        hover:rotate-0 hover:brightness-115
        active:scale-120
        ${className}
      `}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Lobby</span>
    </a>
  );
}
