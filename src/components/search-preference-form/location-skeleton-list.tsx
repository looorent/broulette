function SkeletonItem({ index }: { index: number }) {
  return (
    <div
      key={index}
      className="flex animate-pulse items-center gap-3 px-4 py-3"
    >
      <div className="h-4 w-4 shrink-0 rounded-full bg-fun-dark/10" />
      <div className="h-4 rounded bg-fun-dark/10" style={{ width: `${60 + ((index * 13) % 25) }%` }} />
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="py-1" role="status" aria-label="Loading suggestions">
      {[1, 2, 3].map(index => <SkeletonItem key={index} index={index} />)}
    </div>
  );
}
