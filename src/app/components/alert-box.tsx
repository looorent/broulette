import { XCircle, type LucideProps } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type AlertVariant = "default" | "danger" | "success" | "warning";

export interface AlertBoxOptions {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  icon?: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  variant?: AlertVariant;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
}

interface AlertBoxProps extends AlertBoxOptions {
  isOpen: boolean;
  onClose: () => void;
}

const VARIANT_STYLES: Record<AlertVariant, { topBar: string; iconBorder: string; iconText: string }> = {
  default: {
    topBar: "bg-fun-dark",
    iconBorder: "border-fun-dark",
    iconText: "text-fun-dark",
  },
  danger: {
    topBar: "bg-fun-red",
    iconBorder: "border-fun-dark",
    iconText: "text-fun-red",
  },
  success: {
    topBar: "bg-fun-green",
    iconBorder: "border-fun-dark",
    iconText: "text-fun-green",
  },
  warning: {
    topBar: "bg-fun-yellow",
    iconBorder: "border-fun-dark",
    iconText: "text-fun-yellow",
  }
};

export function AlertBox({
  isOpen,
  onClose,
  title,
  children,
  actions,
  icon,
  variant = "default",
  showCloseButton = false,
  className = "",
  contentClassName = ""
}: AlertBoxProps) {
  const styles = VARIANT_STYLES[variant];

  if (isOpen) {
    const Icon = icon;
    return (
      <dialog
        onClose={onClose}
        className={`
          absolute inset-0
          flex items-center justify-center
          w-full h-full
          p-4
          z-100
          bg-transparent border-none m-0
          transition-all duration-300 ease-in-out
          ${isOpen ? "opacity-100 visible backdrop-blur-sm" : "opacity-0 invisible backdrop-blur-none"}
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        open
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-fun-dark/50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Content */}
        <div id="alert-box-container"
          className={`flex flex-col
            items-center justify-center text-center
            relative
            overflow-hidden
            bg-fun-cream
            border-4 border-fun-dark rounded-xl
            shadown-hard
            transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            w-full max-h-[85vh]
            ${contentClassName}
          `}>

          {/* Header Bar */}
          <div className={`h-4 w-full border-b-4 border-fun-dark shrink-0 ${styles.topBar}`} />

          {showCloseButton && (
            <div className="text-right">
              <button
                onClick={onClose}
                className="absolute top-1 right-1 z-50
                  p-2 r
                  border border-fun-cream bg-fun-cream rounded-full
                  cursor-pointer
                  text-fun-dark
                "
                aria-label="Close"
              >
                <XCircle className="w-8 h-8 stroke-[2.5px]  hover:scale-110 transition-transform" />
              </button>
            </div>
          )}

          <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4 flex-1 min-h-0 w-full overflow-hidden">
            <div className="sm:flex sm:items-start h-full">
              {Icon && (
                <div
                  className={`
                    bg-fun-cream
                    mx-auto flex h-12 w-12 shrink-0 items-center justify-center
                    rounded-full border-2 sm:mx-0 sm:h-10 sm:w-10
                    ${styles.iconBorder} ${styles.iconText}
                  `}
                >
                  <Icon />
                </div>
              )}

              <div className={`
                mt-3 text-center sm:mt-0 sm:text-left
                ${icon ? 'sm:ml-4' : ''}
                w-full h-full flex flex-col
              `}>
                {title ? (
                  <h3 className="text-xl font-bold uppercase tracking-wide text-fun-dark font-pop pr-6" id="alert-box-modal-title">
                    {title}
                  </h3>
                ) : null}

                <div className="mt-2 text-fun-dark flex-1 min-h-0 relative h-full">
                  {children}
                </div>
              </div>
            </div>
          </div>

          {actions && (
            <div className="bg-fun-cream px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2 shrink-0 border-t-2 border-fun-dark/5">
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
