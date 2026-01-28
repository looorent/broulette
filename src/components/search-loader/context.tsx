import { useCallback, useState } from "react";
import { matchPath, useLocation, useNavigation, type Navigation } from "react-router";

import { SearchLoaderContext } from "./hook";
import type { SearchLoaderState } from "./types";

function detectVisibilityBasedOn(navigation: Navigation, pathname: string, isStreaming: boolean): boolean {
  console.log({ navigation });
  console.log({ pathname });

  const isOnAPageStreaming = !!matchPath("/searches/:searchId", pathname) || !!matchPath("/searches/:searchId/candidates/:candidateId", pathname);
  return navigation.state === "submitting" && navigation.formAction?.startsWith("/searches")
    || navigation.state === "loading" && navigation.formMethod != null
    || isOnAPageStreaming && isStreaming;
}

const defaultState: SearchLoaderState = {
  visible: false,
  streaming: false,
  message: undefined
};

export function SearchLoaderProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const { pathname } = useLocation();

  const [activeState, setActiveState] = useState<SearchLoaderState>(defaultState);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const visible = detectVisibilityBasedOn(navigation, pathname, isStreaming);

  if (visible !== activeState.visible || message !== activeState.message || isStreaming !== activeState.streaming) {
    console.log("new active state", { visible: visible, streaming: isStreaming, message: message });
    setActiveState({ visible: visible, streaming: isStreaming, message: message });
  }

  const setLoaderMessage = useCallback((message?: string | undefined) => {
    setMessage(message);
  }, []);

  const setLoaderStreaming = useCallback((streaming: boolean) => {
    setIsStreaming(streaming);
  }, []);

  return (
    <SearchLoaderContext.Provider value={{ setLoaderMessage, setLoaderStreaming, state: activeState }}>
      {children}
    </SearchLoaderContext.Provider>
  );
}
