import { useEffect, useState } from "react";
import { SearchLoaderSpinner } from "./spinner";
import { SearchLoaderTitle } from "./title";

interface SearchLoaderProps {
  title?: string;
  visible: boolean;
}

export function SearchLoader({ title, visible }: SearchLoaderProps) {
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    }
  }, [visible]);

  const handleAnimationEnd = () => {
    if (!visible) {
      setShouldRender(false);
    }
  };

  if (shouldRender) {
    return (
      <main id="search-loader"
        onAnimationEnd={handleAnimationEnd}
        className={`
          relative
          h-full w-full
          overflow-hidden
          ${visible ? "animate-bounce-in" : "animate-bounce-out"}
        `}>

        <div className="absolute inset-0 flex items-center justify-center">
          <SearchLoaderSpinner />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="mt-48">
            <SearchLoaderTitle title={title} />
          </div>
        </div>
      </main>
    );
  } else {
    return null;
  }
}
