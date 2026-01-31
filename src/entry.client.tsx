import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { logger } from "@features/utils/logger";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});

// --- PWA Registration ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((registration) => {
        logger.debug("SW registered: ", registration);
        return null;
      })
      .catch((registrationError) => {
        logger.debug("SW registration failed: ", registrationError);
      });
  });
}
