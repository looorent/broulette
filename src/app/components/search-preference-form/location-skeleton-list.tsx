function SkeletonItem({ index }: { index: number }) {
  const width = 60 + ((index * 13) % 25);
  return (
    <div
      key={index}
      className="flex items-center gap-3 px-4 py-3 animate-pulse"
    >
      <div className="w-4 h-4 rounded-full bg-fun-dark/10 shrink-0" />
      <div className={`
        h-4 rounde
        bg-fun-dark/10
        width-[${width}%]
      `} />
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
