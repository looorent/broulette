import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface GeolocationAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GeolocationAlert({ isOpen, onClose }: GeolocationAlertProps) {
  const [visible, setVisible] = useState(false);

  // animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible && !isOpen) {
    return null;
  } else {
    return (
      <div
        className={`
          fixed inset-0 z-100 overflow-y-auto
          ${isOpen ? "pointer-events-auto" : "pointer-events-none" }
        `}
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >

        <div
          id="geolocation-alert-backdrop"
          className={`
            fixed inset-0
            bg-fun-dark/20 backdrop-blur-sm
            transition-opacity duration-200 ease-out
            ${isOpen ? "opacity-100" : "opacity-0" }
          `}
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          id="geolocation-alert-container"
          className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            className={`
              relative transform overflow-hidden rounded-xl bg-fun-cream text-left
              border-4 border-fun-dark shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
              transition-all duration-200 ease-spring
              sm:my-8 sm:w-full sm:max-w-md
              ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}
            `}
          >
            <div
              id="geolocation-alert-container-topbar"
              className="h-4 w-full border-b-4 border-fun-dark bg-fun-red pattern-diagonal-lines"></div>

            <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">

                <div
                  id="geolocation-alert-container-topbar-icon"
                  className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-fun-cream text-fun-red border-2 border-fun-dark sm:mx-0 sm:h-10 sm:w-10">
                  <X />
                </div>

                <div
                  id="geolocation-alert-container-topbar-text-content"
                  className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3
                    className="text-xl font-bold uppercase tracking-wide text-fun-dark font-pop"
                    id="geolocation-alert-container-topbar-text-content-title"
                  >
                    Browser Error
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm font-bold text-fun-dark">
                      Geolocation is not supported by your browser.
                    </p>
                    <p className="text-xs text-fun-dark mt-1">
                      Please try updating your browser or enabling permissions in your settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              id="geolocation-alert-container-footer"
              className="bg-fun-cream px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="
                  inline-flex w-full justify-center rounded-md
                  bg-fun-red px-4 py-2
                  text-sm font-bold tuppercase tracking-wider
                  border-2 border-fun-dark shadow-hard
                  hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5
                  text-fun-cream
                  transition-all duration-150 ease-out
                  sm:ml-3 sm:w-auto uppercase
                  -rotate-1 hover:rotate-0 hover:scale-105
                  font-pop
                "
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
