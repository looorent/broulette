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
