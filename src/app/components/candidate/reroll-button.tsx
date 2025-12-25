import { RefreshCw } from "lucide-react";
import { href, useRouteLoaderData, useSubmit, type SubmitFunction } from "react-router";

import { triggerHaptics } from "@features/browser.client";
import type { loader as rootLoader } from "app/root";

interface RerollButtonProps {
  enabled: boolean;
  searchId: string;
}


function reRoll(
  enabled: boolean,
  searchId: string,
  csrfToken: string,
  submit: SubmitFunction
) {
  if (enabled) {
    triggerHaptics();
    submit({
      csrf: csrfToken
    }, {
      method: "POST",
      action: href("/searches/:searchId/candidates", { searchId: searchId }),
      replace: true,
      viewTransition: true
    });
  }
}

export function RerollButton({ enabled, searchId }: RerollButtonProps) {
  const submit = useSubmit();
  const session = useRouteLoaderData<typeof rootLoader>("root");
  if (enabled) {
    return (
      <button
        onClick={() => reRoll(enabled, searchId, session?.csrfToken || "", submit)}
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
