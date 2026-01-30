import { RefreshCw } from "lucide-react";
import { href, useRouteLoaderData } from "react-router";

import { triggerHaptics } from "@features/browser.client";
import { useSearchStream } from "@features/search";
import type { loader as rootLoader } from "src/root";

interface RerollButtonProps {
  enabled: boolean;
  searchId: string;
}

export function RerollButton({ enabled, searchId }: RerollButtonProps) {
  const { streamSearch } = useSearchStream();
  const session = useRouteLoaderData<typeof rootLoader>("root");

  const handleReroll = () => {
    if (enabled) {
      triggerHaptics();
      streamSearch(
        href("/searches/:searchId/candidates", { searchId: searchId }),
        session?.csrfToken || ""
      );
    }
  };

  if (enabled) {
    return (
      <button
        onClick={handleReroll}
        className={`
          flex w-20 cursor-pointer items-center justify-center rounded-2xl
          border-4 border-fun-dark bg-fun-yellow shadow-hard
          transition-transform
          hover:brightness-110
          active:translate-y-1 active:shadow-none
        `}
        title="Reroll"
        aria-label="Reroll"
      >
        <RefreshCw className="h-8 w-8 stroke-[3px] text-fun-dark" />
      </button>
    );
  } else {
    return null;
  }
}
