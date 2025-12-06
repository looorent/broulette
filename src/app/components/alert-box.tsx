import { X, XCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type AlertVariant = "default" | "danger" | "success" | "warning";


// TODO The animation does not "pop IN"
interface AlertBoxProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  variant?: AlertVariant;
  showCloseButton?: boolean;
  className?: string;
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
    topBar: "bg-green-500",
    iconBorder: "border-fun-dark",
    iconText: "text-green-600",
  },
  warning: {
    topBar: "bg-yellow-400",
    iconBorder: "border-fun-dark",
    iconText: "text-yellow-600",
  },
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
}: AlertBoxProps) {
  const [visible, setVisible] = useState(false);
  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-100
        ${isOpen ? "pointer-events-auto" : "pointer-events-none"}
        ${className}
      `}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0
          bg-fun-dark/20 backdrop-blur-sm
          transition-opacity duration-300 ease-in-out
          ${isOpen ? "opacity-100" : "opacity-0"}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Modal Container  */}
        <div
          className={`
            relative transform overflow-hidden rounded-xl bg-fun-cream text-left
            border-4 border-fun-dark shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
            transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            w-full sm:max-w-lg md:max-w-xl
            flex flex-col max-h-[85dvh]

            ${isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-90 translate-y-8 pointer-events-none"
            }
          `}
        >
          {/* Header Bar - No shrink */}
          <div className={`h-4 w-full border-b-4 border-fun-dark pattern-diagonal-lines shrink-0 ${styles.topBar}`} />

          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-6 right-4 p-1 text-fun-dark/50 hover:text-fun-dark hover:bg-black/5 rounded-full transition-colors z-10"
              aria-label="Close"
            >
              <XCircle className="w-8 h-8 stroke-[2.5px]" />
            </button>
          )}

          <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4 overflow-y-auto flex-1 min-h-0 overscroll-contain touch-pan-y">
            <div className="sm:flex sm:items-start">
              {icon && (
                <div
                  className={`
                    mx-auto flex h-12 w-12 shrink-0 items-center justify-center
                    rounded-full bg-fun-cream border-2 sm:mx-0 sm:h-10 sm:w-10
                    ${styles.iconBorder} ${styles.iconText}
                  `}
                >
                  {icon}
                </div>
              )}

              <div className={`mt-3 text-center sm:mt-0 sm:text-left ${icon ? 'sm:ml-4' : ''} w-full`}>
                { title ? (
                  <h3 className="text-xl font-bold uppercase tracking-wide text-fun-dark font-pop pr-6" id="modal-title">
                    {title}
                  </h3>
                ) : null}

                <div className="mt-2 text-fun-dark">
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
      </div>
    </div>
  );
}
