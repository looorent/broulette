import LoadingSpinner from "./loading-spinner";
import { LoadingTitle } from "./loading-title";

interface LoaderContainerProps {
  title?: string;
}

export function LoaderContainer({ title }: LoaderContainerProps) {
  return (
    <main id="loader-container"
      className="h-full relative flex flex-col items-center justify-center gap-10">
      <LoadingSpinner />
      <LoadingTitle title={title} />
    </main>
  );
}
