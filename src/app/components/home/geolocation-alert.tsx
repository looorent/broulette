import { useEffect, useState } from "react";
import { AlertBox } from "../alert-box";

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
      <AlertBox
        isOpen={isOpen}
        onClose={onClose}
        title="Geolocation is not supported by your browser."
        variant="danger"
        actions={
          <button
            type="button"
            onClick={onClose}
            className="
            inline-flex w-full justify-center rounded-md
            bg-fun-red px-4 py-2
            text-sm font-bold uppercase tracking-wider
            border-2 border-fun-dark shadow-hard
            hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5
            text-fun-cream
            transition-all duration-150 ease-out
            sm:ml-3 sm:w-auto
            -rotate-1 hover:rotate-0 hover:scale-105
            font-pop
          ">
            Dismiss
          </button>
        }
      >
        <p className="text-fun-dark mt-2 font-sans">
          Please try updating your browser or enabling permissions in your settings.
        </p>
      </AlertBox>
    );
  }
}
