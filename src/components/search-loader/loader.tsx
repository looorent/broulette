import { useState, useEffect, useRef } from "react";

import { SearchLoaderSpinner } from "./spinner";
import { SearchLoaderTitle } from "./title";

interface SearchLoaderProps {
  title?: string;
  visible: boolean;
}

// TODO make it configurable
const MESSAGE_DURATION = 1_500;

export function SearchLoader({ title, visible }: SearchLoaderProps) {
  const [shouldRender, setShouldRender] = useState(visible);

  if (visible && !shouldRender) {
    setShouldRender(true);
  }

  const handleAnimationEnd = () => {
    if (!visible) {
      setShouldRender(false);
    }
  };

  const [displayedTitle, setDisplayedTitle] = useState(title);
  const queue = useRef<string[]>([]);
  const isProcessing = useRef(false);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const processQueue = async () => {
    if (!isProcessing.current) {
      isProcessing.current = true;
      while (queue.current.length > 0 && isMounted.current) {
        const nextTitle = queue.current.shift();
        if (nextTitle) {
          setDisplayedTitle(nextTitle);
          await new Promise((resolve) => setTimeout(resolve, MESSAGE_DURATION));
        }
      }
      isProcessing.current = false;
    };
  };

  useEffect(() => {
    if (title && title !== displayedTitle) {
      queue.current.push(title);
      processQueue();
    }
  }, [title, displayedTitle]);

  if (shouldRender) {
    return (
      <main
        id="search-loader"
        onAnimationEnd={handleAnimationEnd}
        className={`
          relative h-full w-full overflow-hidden
          ${visible ? "animate-bounce-in" : "animate-bounce-out"}
        `}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <SearchLoaderSpinner />
        </div>

        <div className={`
          pointer-events-none absolute inset-0 flex items-center justify-center
        `}>
          <div className="mt-48 transition-all duration-500">
            <SearchLoaderTitle title={displayedTitle} />
          </div>
        </div>
      </main>
    );
  } else {
    return null;
  }
}
