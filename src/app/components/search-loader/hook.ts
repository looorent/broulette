import { createContext, useContext } from "react";

import type { SearchLoaderContextType } from "./types";

export const SearchLoaderContext = createContext<SearchLoaderContextType | undefined>(undefined);

export function useSearchLoader() {
  const context = useContext(SearchLoaderContext);
  if (!context) {
    throw new Error("useSearchLoader() must be used within a SearchLoaderProvider");
  } else {
    return context;
  }
}
