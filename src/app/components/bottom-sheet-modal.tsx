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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isOpen) {
      setIsMounted(true);
      timeoutId = setTimeout(() => setShowContent(true), 10);
    } else {
      setShowContent(false);
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
        flex flex-col absolute inset-0 z-50 items-center justify-end
        py-0 px-2 backdrop-blur-sm w-full h-dvh border-none m-0 max-w-full max-h-full bg-transparent
        transform transition-transform duration-300
        ${showContent ? "ease-out translate-y-0" : "ease-in translate-y-full"}
        ${className}
      `}
        aria-labelledby="bottom-sheet-modal-title"
        role="dialog"
        aria-modal="true"
        open
      >
        <div className="
        flex flex-col
        bg-fun-cream
        w-full
        border-x-2 border-t-4 border-fun-dark rounded-t-3xl
        p-6 pb-10 md:pb-6
        shadow-hard relative mx-auto max-h-[90vh]
        touch-pan-y">

          {/* Header */}
          <div id="bottom-sheet-header"
            {...bindDrag()}
            className="w-full pt-0 pb-6 -mt-6 cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="w-20 h-2 bg-fun-dark/80 rounded-full mx-auto mt-6"></div>
          </div>

          {/* Title */}
          <div className="flex justify-between items-center mb-6">
            {title && <h3 className="font-pop text-3xl text-fun-dark" id="alert-box-modal-title">{title}</h3>}
            <button
              onClick={onClose}
              className="text-fun-dark hover:scale-110 transition-transform cursor-pointer"
              aria-label="Close"
            >
              <XCircle className="w-8 h-8 stroke-[2.5px]" />
            </button>
          </div>

          {/* Body of the modal */}
          <div className="w-full flex-1 overflow-y-auto min-h-0 pb-10 overscroll-contain">
            {children}
          </div>
        </div>
      </dialog>
    );
  } else {
    return null;
  }
}
