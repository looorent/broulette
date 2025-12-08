import { SearchLoaderSpinner } from "./search-loader-spinner";

interface SearchLoaderProps {
  title?: string;
}

export function SearchLoader({ title }: SearchLoaderProps) {
  return (
    <main id="search-loader"
      className="h-full relative flex flex-col items-center justify-center gap-10">
      <SearchLoaderSpinner />
      {/* <SearchLoaderTitle title={title} /> */}
    </main>
  );
}
