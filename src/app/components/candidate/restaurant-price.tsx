export function RestaurantPrice({ range }: {
  range: string | null | undefined
}) {
  if (range && range.length > 0) {
    return (
      <div id="candidate-price"
        className={`
          absolute top-3 right-3 z-10 rounded-xl border-[3px] border-fun-dark
          bg-fun-yellow px-3 py-1 text-sm font-bold text-fun-dark
          shadow-hard-hover
        `}>
        {range}
      </div>
    );
  } else {
    return null;
  }
}
