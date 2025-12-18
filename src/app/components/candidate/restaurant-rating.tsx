import { Star } from "lucide-react";

export function RestaurantRating({ rating }: {
  rating: string | null | undefined
}) {
  if (rating && rating.length > 0) {
    return (
      <div id="candidate-rating"
        className="
          absolute
          -top-5 left-6
          bg-fun-green
          border-[3px] border-fun-dark rounded-full
          px-3 py-1
          font-bold text-white shadow-hard-hover
          flex items-center
          gap-1 transform
          -rotate-3 z-20
        ">
        <Star className="w-4 h-4 fill-fun-cream" />
        <span>{rating}</span>
      </div>
    );
  } else {
    return null;
  }
}
