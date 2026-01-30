export interface SearchLoaderState {
  visible: boolean;
  streaming: boolean;
  message?: string;
};

export function defaultSearchLoaderState(): SearchLoaderState {
  return {
    visible: false,
    streaming: false,
    message: undefined
  };
}

export interface SearchLoaderContextType {
  setLoaderMessage: (message: string, instant?: boolean) => void;
  setLoaderStreaming: (streaming: boolean) => void;
  state: SearchLoaderState;
}
