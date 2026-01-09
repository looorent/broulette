import { createContext, useContext } from "react";

import type { AlertContextType } from "./types";

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlertContext() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlertContext must be used within a UIProvider");
  } else {
    return context;
  }
}
