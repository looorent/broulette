export interface SearchLoaderState {
  visible: boolean;
  message?: string;
};

export function defaultSearchLoaderState(): SearchLoaderState {
  return {
    visible: false,
    message: undefined
  };
}

export interface SearchLoaderContextType {
  setManualLoader: (visible: boolean, message?: string) => void;
  state: SearchLoaderState;
}
