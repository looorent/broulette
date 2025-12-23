// we do not use this component for the moment
interface RestaurantDescriptionProps {
  description: string | null | undefined;
  className?: string;
}

export function RestaurantDescription({
  description,
  className = ""
}: RestaurantDescriptionProps) {
  if (description && description.length > 0) {
    return (
      <p id="candidate-description"
        className={`
          font-sans font-medium
          text-fun-dark/70 text-md
          leading-snug
          mb-4 line-clamp-3
          ${className}
        `}>
        {description}
      </p>
    );

  } else {
    return null;
  }
}
