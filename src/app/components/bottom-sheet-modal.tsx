import { useDrag } from "@use-gesture/react";
import { XCircle } from "lucide-react";
import { type ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

const DRAG_TRESHOLD_IN_PIXELS = 50;

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className = ""
}: BottomSheetProps) {
  const bindDrag = useDrag(({ down, movement: [, my] }) => {
    if (down && my > DRAG_TRESHOLD_IN_PIXELS) { // TODO not sure the 50 is needed here because we have defined the treshold
      onClose();
    }
  }, {
    axis: "y",
    filterTaps: true,
    threshold: DRAG_TRESHOLD_IN_PIXELS
  });

  return (
    <dialog
      className={`
        flex flex-col fixed inset-0 z-100 items-center justify-end
        py-0 px-2 backdrop-blur-sm w-full h-dvh border-none m-0 max-w-full max-h-full bg-transparent
        transform transition-transform duration-300
        ${isOpen ? "ease-out" : "ease-in"}
        ${isOpen ? "translate-y-0" : "translate-y-full"}
        ${className}
      `}
      open
    >
      <div className="bg-fun-cream w-full sm:max-w-md border-x-2 border-t-4 border-fun-dark rounded-t-3xl sm:rounded-3xl p-6 pb-10 shadow-hard relative mx-auto max-h-[90vh] touch-pan-y">
        <div
          {...bindDrag()}
          className="w-full pt-0 pb-6 -mt-6 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-20 h-2 bg-fun-dark/80 rounded-full mx-auto mt-6"></div>
        </div>

        <div className="flex justify-between items-center mb-6">
          {title && <h3 className="font-pop text-3xl text-fun-dark">{title}</h3>}
          <button
            onClick={onClose}
            className="text-fun-dark hover:scale-110 transition-transform"
            aria-label="Close"
          >
            <XCircle className="w-8 h-8 stroke-[2.5px]" />
          </button>
        </div>
        <div className="w-full">
          {children}
        </div>
      </div>
    </dialog>
  );
}
