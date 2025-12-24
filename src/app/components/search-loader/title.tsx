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
    <div className="text-center relative z-10 px-6 min-h-22 justify-center items-start">
      <h3 id="loading-title"
          className="
          font-pop
          text-3xl md:text-4xl
          text-fun-cream drop-shadow-hard
          uppercase tracking-wide
          animate-pulse text-center leading-tight
        ">
        {MESSAGES[messageIndex]}
      </h3>
    </div>
  );
}
