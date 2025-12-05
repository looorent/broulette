export function SkeletonList() {
  return (
    <div className="py-1" role="status" aria-label="Loading suggestions">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 animate-pulse"
        >
          <div className="w-4 h-4 rounded-full bg-fun-dark/10 shrink-0" />
          <div
            className="h-4 rounded bg-fun-dark/10"
            style={{ width: `${Math.floor(Math.random() * (85 - 60) + 60)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
