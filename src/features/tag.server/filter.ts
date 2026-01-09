import type { RestaurantTagConfiguration } from "./types";

export function filterTags(
  tags: string[] | undefined,
  configuration: RestaurantTagConfiguration
): string[] {
  let processedTags = tags ? [...tags] : [];
  if (processedTags.length > 0) {
    processedTags = removeHiddenTags(processedTags, configuration.hiddenTags);
    processedTags = removeSuffixes(processedTags);
    processedTags = applyPrioritySorting(processedTags, configuration.priorityTags);
    processedTags = limitTagCount(processedTags, configuration.maxTags);
  }
  return processedTags;
}

function removeHiddenTags(tags: string[], hiddenTags?: string[]): string[] {
  if (!hiddenTags || hiddenTags.length === 0) {
    return tags;
  } else {
    const hiddenSet = new Set(hiddenTags.map(tag => tag.toLowerCase()));
    return tags.filter(tag => !hiddenSet.has(tag.toLowerCase()));
  }
}

function applyPrioritySorting(tags: string[], priorityTags?: string[]): string[] {
  if (!priorityTags || priorityTags.length === 0) {
    return tags;
  } else {
    const prioritySet = new Set(priorityTags.map(tag => tag.toLowerCase()));
    return [...tags].sort((tag, otherTag) => {
      const priority = prioritySet.has(tag.toLowerCase()) ? 1 : 0;
      const otherPriority = prioritySet.has(otherTag.toLowerCase()) ? 1 : 0;
      return otherPriority - priority;
    });
  }
}

function limitTagCount(tags: string[], maxTags?: number): string[] {
  if (maxTags !== undefined && maxTags > 0) {
    return tags.slice(0, maxTags);
  } else {
    return tags;
  }
}

function removeSuffixes(tags: string[]): string[] {
  return tags.map(tag => tag.replace("_restaurant", "")).filter(tag => tag.trim()).filter(Boolean);
}

