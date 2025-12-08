export type LoaderState = {
  visible: boolean;
  message?: string;
};

export type RootContextType = {
  startLoader: (message?: string) => void;
  updateLoader: (updates: Partial<Omit<LoaderState, "visible">>) => void;
  stopLoader: () => void;
};
