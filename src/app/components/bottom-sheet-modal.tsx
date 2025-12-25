import { useDrag } from "@use-gesture/react";
import { XCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

const DRAG_TRESHOLD_IN_PIXELS = 10;

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className = ""
}: BottomSheetProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showContent, setShowContent] = useState(false);

  if (isOpen && !isMounted) {
    setIsMounted(true);
  } else if (!isOpen && showContent) {
    setShowContent(false);
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isOpen) {
      timeoutId = setTimeout(() => setShowContent(true), 10);
    } else {
      timeoutId = setTimeout(() => setIsMounted(false), 300);
    }

    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  const bindDrag = useDrag(({ down, movement: [, my] }) => {
    if (down && my > DRAG_TRESHOLD_IN_PIXELS) {
      onClose();
    }
  }, {
    axis: "y",
    filterTaps: true,
    threshold: DRAG_TRESHOLD_IN_PIXELS
  });

  if (isMounted) {
    return (
      <dialog
        className={`
          absolute inset-0 z-50 m-0 flex h-dvh max-h-full w-full max-w-full
          transform flex-col items-center justify-end border-none bg-transparent
          px-2 py-0 backdrop-blur-sm transition-transform duration-300
          ${showContent ? "translate-y-0 ease-out" : "translate-y-full ease-in"}
          ${className}
        `}
        aria-labelledby="bottom-sheet-modal-title"
        aria-modal="true"
        open
      >
        <div className={`
          relative mx-auto flex max-h-[90vh] w-full touch-pan-y flex-col
          rounded-t-3xl border-x-2 border-t-4 border-fun-dark bg-fun-cream p-6
          pb-10 shadow-hard
          md:pb-6
        `}>

          {/* Header */}
          <div id="bottom-sheet-header"
            {...bindDrag()}
            className={`
              -mt-6 w-full cursor-grab touch-none pt-0 pb-6
              active:cursor-grabbing
            `}
          >
            <div className="mx-auto mt-6 h-2 w-20 rounded-full bg-fun-dark/80"></div>
          </div>

          {/* Title */}
          <div className="mb-6 flex items-center justify-between">
            {title && <h3 className="font-pop text-3xl text-fun-dark" id="alert-box-modal-title">{title}</h3>}
            <button
              onClick={onClose}
              className={`
                cursor-pointer text-fun-dark transition-transform
                hover:scale-110
              `}
              aria-label="Close"
            >
              <XCircle className="h-8 w-8 stroke-[2.5px]" />
            </button>
          </div>

          {/* Body of the modal */}
          <div className={`
            min-h-0 w-full flex-1 overflow-y-auto overscroll-contain pb-10
          `}>
            {children}
          </div>
        </div>
      </dialog>
    );
  } else {
    return null;
  }
}
