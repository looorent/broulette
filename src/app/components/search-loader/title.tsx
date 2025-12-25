import { useEffect, useState } from "react";

const MESSAGES = [
  "Consulting the Food Gods...",
  "Consulting stars...",
  "Scanning hunger...",
  "Avoiding kale...",
  "Calibrating...",
  "Rolling flavor..."
];

interface SearchLoaderTitleProps {
  title?: string;
}

// TODO use variable 'title'
export function SearchLoaderTitle({ title: _title }: SearchLoaderTitleProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={`
      relative z-10 min-h-22 items-start justify-center px-6 text-center
    `}>
      <h3 id="loading-title"
          className={`
            animate-pulse text-center font-pop text-3xl leading-tight
            tracking-wide text-fun-cream uppercase
            md:text-4xl
          `}>
        {MESSAGES[messageIndex]}
      </h3>
    </div>
  );
}
