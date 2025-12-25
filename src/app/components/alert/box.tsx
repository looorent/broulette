import { XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import type { AlertBoxOptions, AlertVariant } from "./types";

interface AlertBoxProps extends AlertBoxOptions {
  isOpen: boolean;
  onClose: () => void;
}

const VARIANT_STYLES: Record<AlertVariant, { topBar: string; iconBorder: string; iconText: string }> = {
  default: {
    topBar: "bg-fun-dark",
    iconBorder: "border-fun-dark",
    iconText: "text-fun-dark"
  },
  danger: {
    topBar: "bg-fun-red",
    iconBorder: "border-fun-dark",
    iconText: "text-fun-red"
  },
  success: {
    topBar: "bg-fun-green",
    iconBorder: "border-fun-dark",
    iconText: "text-fun-green"
  },
  warning: {
    topBar: "bg-fun-yellow",
    iconBorder: "border-fun-dark",
    iconText: "text-fun-yellow"
  }
};

export function AlertBox({
  isOpen,
  onClose,
  title,
  children,
  actions,
  icon: Icon,
  variant = "default",
  showCloseButton = false,
  className = "",
  contentClassName = ""
}: AlertBoxProps) {
  const styles = VARIANT_STYLES[variant];

  const [isMounted, setIsMounted] = useState(isOpen);
  const [showContent, setShowContent] = useState(isOpen);

  if (isOpen && !isMounted) {
    setIsMounted(true);
  } else if (!isOpen && showContent) {
    setShowContent(false);
  }

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setShowContent(true));
    }
  }, [isOpen]);

  const handleTransitionEnd = () => {
    if (!isOpen) {
      setIsMounted(false);
    }
  };

  if (isMounted) {
    return (
      <dialog
        className={`
          absolute inset-0 z-50 m-0 flex h-full w-full items-center
          justify-center border-none bg-transparent p-4 transition-all
          duration-300 ease-in-out
          ${showContent ? "visible backdrop-blur-sm" : `
            invisible backdrop-blur-none
          `}
          ${className}
        `}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Backdrop */}
        <button
          type="button"
          className={`
            absolute inset-0 h-full w-full cursor-default bg-fun-dark/50
            transition-opacity duration-300
            ${showContent ? "opacity-100" : "opacity-0"}
            focus:outline-none
          `}
          onClick={onClose}
          aria-label="Close modal"
        />

        {/* Content */}
        <div
          id="alert-box-container"
          className={`
            relative flex max-h-[85vh] w-full transform flex-col items-center
            justify-center overflow-hidden rounded-xl border-4 border-fun-dark
            bg-fun-cream text-center shadow-hard transition-all duration-300
            ${contentClassName}
            ${showContent
              ? `
                translate-y-0 scale-100 opacity-100
                ease-[cubic-bezier(0.34,1.56,0.64,1)]
              `
              : "translate-y-4 scale-95 opacity-0 ease-in"}
          `}
          role="none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`
            h-4 w-full shrink-0 border-b-4 border-fun-dark
            ${styles.topBar}
          `} />

          {showCloseButton && (
            <div className="absolute top-1 right-1 z-50">
              <button
                onClick={onClose}
                className={`
                  absolute top-1 right-1 z-50 cursor-pointer rounded-full border
                  border-fun-cream bg-fun-cream p-2 text-fun-dark
                `}
                aria-label="Close"
              >
                <XCircle className={`
                  h-8 w-8 stroke-[2.5px] transition-transform
                  hover:scale-110
                `} />
              </button>
            </div>
          )}

          <div className={`
            min-h-0 w-full flex-1 overflow-hidden px-4 pt-5 pb-4
            sm:p-6 sm:pb-4
          `}>
            <div className={`
              h-full
              sm:flex sm:items-start
            `}>
              {Icon && (
                <div className={`
                  mx-auto flex h-12 w-12 shrink-0 items-center justify-center
                  rounded-full border-2 bg-fun-cream
                  sm:mx-0 sm:h-10 sm:w-10
                  ${styles.iconBorder}
                  ${styles.iconText}
                `}>
                  <Icon />
                </div>
              )}

              <div className={`
                mt-3 text-center
                sm:mt-0 sm:text-left
                ${Icon ? 'sm:ml-4' : ''}
                flex h-full w-full flex-col
              `}>
                {title && (
                  <h3 className={`
                    pr-6 font-pop text-xl font-bold tracking-wide text-fun-dark
                    uppercase
                  `}>
                    {title}
                  </h3>
                )}
                <div className={`
                  relative mt-2 h-full min-h-0 flex-1 text-fun-dark
                `}>
                  {children}
                </div>
              </div>
            </div>
          </div>

          {actions && (
            <div className={`
              shrink-0 gap-2 border-t-2 border-fun-dark/5 bg-fun-cream px-4 py-3
              sm:flex sm:flex-row-reverse sm:px-6
            `}>
              {actions}
            </div>
          )}
        </div>
      </dialog>
    );
  } else {
    return null;
  }
}
