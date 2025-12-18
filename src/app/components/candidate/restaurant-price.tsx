export function RestaurantPrice({ range }: {
  range: string | null | undefined
}) {
  if (range && range.length > 0) {
    return (
      <div id="candidate-price"
        className="
          absolute top-3 right-3
          bg-fun-yellow
          border-[3px] border-fun-dark rounded-xl
          px-3 py-1
          font-bold text-fun-dark text-sm
          shadow-hard-hover z-10
      ">
        {range}
      </div>
    );
  } else {
    return null;
  }
}
