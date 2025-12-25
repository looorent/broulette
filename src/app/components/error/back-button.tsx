import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Back to Lobby"
      className={`
        mt-8 flex animate-slide-in-from-top-right cursor-pointer items-center
        justify-center gap-2 rounded-md border-[3px] border-fun-dark
        bg-fun-cream/95 p-4 font-pop text-xl font-bold tracking-wide
        text-fun-dark shadow-hard-hover backdrop-blur-md
        hover:rotate-0 hover:brightness-115
        active:scale-120
      `}
    >
      <ArrowLeft className="h-8 w-8 stroke-[3px]" />
      <span>Back</span>
    </button>
  );
}
