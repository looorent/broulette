import type { AlertBoxOptions } from "@components/alert/box";
import { createContext, useContext, useState, type ReactNode } from "react";

interface AlertContextType {
  isAlertOpen: boolean;
  alertOptions: AlertBoxOptions | null;
  openAlert: (options: AlertBoxOptions | null) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertBoxOptions | null>(null);

  const openAlert = (options: AlertBoxOptions | null) => {
    setAlertOptions(options);
    setIsAlertOpen(true);
  };

  const closeAlert = () => {
    setIsAlertOpen(false);
    // TODO should we reset the options after rendering?
  };

  return (
    <AlertContext.Provider value={{ isAlertOpen, alertOptions, openAlert, closeAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlertContext() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlertContext must be used within a UIProvider");
  } else {
    return context;
  }
}
