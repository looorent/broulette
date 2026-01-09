import { Share2 } from "lucide-react";
import { href } from "react-router";

import { shareSocial, triggerHaptics } from "@features/browser.client";

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
      className={`
        absolute top-3 left-3 z-20 cursor-pointer rounded-xl border-[3px]
        border-fun-dark bg-fun-cream/95 p-3 text-fun-dark shadow-hard-hover
        backdrop-blur-md transition-transform
        active:scale-95
      `}
      title="Share"
      aria-label="Share Restaurant"
    >
      <Share2 className="h-6 w-6 stroke-[2.5px]" />
    </button>
  );
}
