import { shareSocial, triggerHaptics } from "@features/browser.client";
import { Share2 } from "lucide-react";
import { href } from "react-router";

export function ShareButton({ searchId, candidateId, restaurantName, restaurantDescription } : {
  searchId: string;
  candidateId: string;
  restaurantName: string | null | undefined;
  restaurantDescription: string | null | undefined;
}) {
  const url = href("/searches/:searchId/candidates/:candidateId", { searchId: searchId, candidateId: candidateId });

  const shareResult = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareSocial(restaurantName || "", restaurantDescription, url);
    triggerHaptics();
  };

  return (
    <button
      onClick={shareResult}
      className="
        absolute top-3 left-3
        bg-fun-cream/95
        backdrop-blur-md shadow-hard-hover
        border-[3px] border-fun-dark rounded-xl
        p-3
        text-fun-dark
        active:scale-95 transition-transform
        z-20 cursor-pointer
      "
      title="Share"
      aria-label="Share Restaurant"
    >
      <Share2 className="w-6 h-6 stroke-[2.5px]" />
    </button>
  );
}
