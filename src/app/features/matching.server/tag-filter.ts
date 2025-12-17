import type { RestaurantTagConfiguration } from "./types";

// TODO review
export function filterTags(
  tags: string[] | undefined,
  configuration: RestaurantTagConfiguration
): string[] {
  if (tags) {
    let result = [...tags];
    if (configuration.hiddenTags && configuration.hiddenTags.length > 0) {
      const hiddenSet = new Set(configuration.hiddenTags.map(t => t.toLowerCase()));
      result = result.filter(tag => !hiddenSet.has(tag.toLowerCase()));
    }

    if (configuration.priorityTags && configuration.priorityTags.length > 0) {
      const prioritySet = new Set(configuration.priorityTags.map(t => t.toLowerCase()));
      result.sort((a, b) => {
        const isAPriority = prioritySet.has(a.toLowerCase());
        const isBPriority = prioritySet.has(b.toLowerCase());

        if (isAPriority && !isBPriority) {
          return -1;
        } else if (!isAPriority && isBPriority) {
          return 1;
        } else {
          return 0;
        }
      });
    }

    if (configuration.maxTags !== undefined && configuration.maxTags > 0) {
      result = result.slice(0, configuration.maxTags);
    }

    return result;
  } else {
    return [];
  }
}
