import { triggerHaptics } from "@features/browser.client";
import { RefreshCw } from "lucide-react";
import { href, useSubmit } from "react-router";

export function RerollButton({ enabled, searchId }: {
  enabled: boolean;
  searchId: string;
}) {
  if (enabled) {
    const submit = useSubmit();

    const reRoll = () => {
      if (enabled) {
        triggerHaptics();
        submit({}, {
          method: "POST",
          action: href("/searches/:searchId/candidates", { searchId: searchId }),
          replace: true,
          viewTransition: true
        });
      }
    };

    return (
      <button
        onClick={reRoll}
        className="w-20
        bg-fun-yellow
        border-4 border-fun-dark rounded-2xl
        flex items-center justify-center
        shadow-hard
        transition-transform active:translate-y-1 active:shadow-none hover:brightness-110 cursor-pointer"
        title="Reroll"
        aria-label="Reroll"
      >
        <RefreshCw className="w-8 h-8 stroke-[3px] text-fun-dark" />
      </button>
    );
  } else {
    return null;
  }
}
