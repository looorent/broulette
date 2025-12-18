export function RestaurantDescription({description}: { description: string | null | undefined }) {
  if (description && description.length > 0) {
    return (
      <p id="candidate-description"
        className="
          font-sans font-medium
          text-fun-dark/70 text-lg
          leading-snug
          mb-4 line-clamp-3">
        {description}
      </p>
    );

  } else {
    return null;
  }
}
