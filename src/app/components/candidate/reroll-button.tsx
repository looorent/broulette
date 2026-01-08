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
