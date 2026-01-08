import { Star } from "lucide-react";

export function RestaurantRating({ rating }: {
  rating: string | null | undefined
}) {
  if (rating && rating.length > 0) {
    return (
      <div className="relative">
        <div id="candidate-rating"
          className={`
            absolute -bottom-4 left-3 z-1 flex shrink-0 -rotate-3 transform
            items-center gap-1 rounded-full border-[3px] border-fun-dark
            bg-fun-green px-3 py-1 font-bold text-white shadow-hard-hover
          `}>
          <Star className="h-4 w-4 fill-fun-cream" />
          <span>{rating}</span>
        </div>
      </div>
    );
  } else {
    return null;
  }
}
