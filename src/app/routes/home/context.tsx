import { createContext, useContext, useState, type ReactNode } from "react";
import type { AlertBoxOptions } from "~/components/alert-box";

interface HomeContextType {
  isAlertOpen: boolean;
  alertOptions: AlertBoxOptions | null;
  openAlert: (options: AlertBoxOptions | null) => void;
  closeAlert: () => void;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

export function HomeProvider({ children }: { children: ReactNode }) {
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
    <HomeContext.Provider value={{ isAlertOpen, alertOptions, openAlert, closeAlert }}>
      {children}
    </HomeContext.Provider>
  );
}

export function useHomeContext() {
  const context = useContext(HomeContext);
  if (!context) {
    throw new Error("useHomeContext must be used within a UIProvider");
  } else {
    return context;
  }
}
