import { useState, type ReactNode } from "react";
import { AlertContext } from "./hook";
import type { AlertBoxOptions } from "./types";

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertBoxOptions | null>(null);

  const openAlert = (options: AlertBoxOptions | null) => {
    setAlertOptions(options);
    setIsAlertOpen(true);
  };

  const closeAlert = () => {
    setIsAlertOpen(false);
  };

  return (
    <AlertContext.Provider value={{ isAlertOpen, alertOptions, openAlert, closeAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

