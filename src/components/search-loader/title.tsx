interface SearchLoaderTitleProps {
  title?: string;
}

export function SearchLoaderTitle({ title }: SearchLoaderTitleProps) {
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
        {title}
      </h3>
    </div>
  );
}
