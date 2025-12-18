import { RestaurantTag } from "./restaurant-tag";

export function RestaurantTags({ tags }: { tags: { id: string; label: string }[] | undefined | null }) {
  if (tags && tags?.length > 0) {
    return (
      <div id="candidate-tags" className="flex gap-2 flex-wrap pt-2">
        {tags.map(tag => <RestaurantTag key={tag.id} id={tag.id} label={tag.label} />)}
      </div>
    );
  } else {
    return null;
  }
}
