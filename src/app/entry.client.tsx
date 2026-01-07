// app/entry.client.tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

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
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.debug("SW registered: ", registration);
        return null;
      })
      .catch((registrationError) => {
        console.debug("SW registration failed: ", registrationError);
      });
  });
}
