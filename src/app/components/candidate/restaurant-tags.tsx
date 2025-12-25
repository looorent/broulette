import type { TagView } from "@features/tag";

import { RestaurantTag } from "./restaurant-tag";

export interface RestaurantTagsProps {
  tags: TagView[] | undefined | null;
}

export function RestaurantTags({ tags }: RestaurantTagsProps) {
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
