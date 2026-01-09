import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type AlertVariant = "default" | "danger" | "success" | "warning";
export interface AlertBoxOptions {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  icon?: LucideIcon;
  variant?: AlertVariant;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
}

export interface AlertContextType {
  isAlertOpen: boolean;
  alertOptions: AlertBoxOptions | null;
  openAlert: (options: AlertBoxOptions | null) => void;
  closeAlert: () => void;
}
