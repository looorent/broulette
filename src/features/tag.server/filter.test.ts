import { describe, expect, it } from "vitest";

import { filterTags } from "./filter";
import type { RestaurantTagConfiguration } from "./types";

describe("filterTags", () => {
  const defaultConfig: RestaurantTagConfiguration = {
    hiddenTags: [],
    maxTags: 5,
    priorityTags: []
  };

  describe("basic filtering", () => {
    it("returns empty array for undefined tags", () => {
      const result = filterTags(undefined, defaultConfig);
      expect(result).toEqual([]);
    });

    it("returns empty array for empty tags array", () => {
      const result = filterTags([], defaultConfig);
      expect(result).toEqual([]);
    });

    it("returns tags unchanged when no filters apply", () => {
      const tags = ["italian", "pizza", "pasta"];
      const result = filterTags(tags, defaultConfig);
      expect(result).toEqual(tags);
    });
  });

  describe("semicolon-separated tags splitting", () => {
    it("splits semicolon-separated tags into individual tags", () => {
      const result = filterTags(["italian;french", "pizza"], defaultConfig);
      expect(result).toEqual(["italian", "french", "pizza"]);
    });

    it("trims whitespace around split tags", () => {
      const result = filterTags(["italian ; french"], defaultConfig);
      expect(result).toEqual(["italian", "french"]);
    });

    it("filters out empty segments", () => {
      const result = filterTags(["italian;;french", ";pizza;"], defaultConfig);
      expect(result).toEqual(["italian", "french", "pizza"]);
    });
  });

  describe("hidden tags removal", () => {
    it("removes hidden tags", () => {
      const config: RestaurantTagConfiguration = {
        ...defaultConfig,
        hiddenTags: ["restaurant", "food"]
      };
      const tags = ["italian", "restaurant", "pizza", "food"];

      const result = filterTags(tags, config);

      expect(result).toEqual(["italian", "pizza"]);
    });

    it("removes hidden tags case-insensitively", () => {
      const config: RestaurantTagConfiguration = {
        ...defaultConfig,
        hiddenTags: ["Restaurant", "FOOD"]
      };
      const tags = ["italian", "restaurant", "pizza", "food"];

      const result = filterTags(tags, config);

      expect(result).toEqual(["italian", "pizza"]);
    });

    it("handles empty hiddenTags array", () => {
      const config: RestaurantTagConfiguration = {
        ...defaultConfig,
        hiddenTags: []
      };
      const tags = ["italian", "pizza"];

      const result = filterTags(tags, config);

      expect(result).toEqual(["italian", "pizza"]);
    });
  });

  describe("suffix removal", () => {
    it("removes _restaurant suffix from tags", () => {
      const tags = ["italian_restaurant", "pizza_restaurant", "pasta"];

      const result = filterTags(tags, defaultConfig);

      expect(result).toEqual(["italian", "pizza", "pasta"]);
    });

    it("filters out tags that become empty after suffix removal", () => {
      const tags = ["italian", "_restaurant", "   "];

      const result = filterTags(tags, defaultConfig);

      expect(result).not.toContain("");
      expect(result).not.toContain("   ");
    });
  });

  describe("priority sorting", () => {
    it("moves priority tags to the front", () => {
      const config: RestaurantTagConfiguration = {
        ...defaultConfig,
        priorityTags: ["sushi"]
      };
      const tags = ["italian", "pizza", "sushi", "pasta"];

      const result = filterTags(tags, config);

      expect(result[0]).toBe("sushi");
    });

    it("handles multiple priority tags", () => {
      const config: RestaurantTagConfiguration = {
        ...defaultConfig,
        priorityTags: ["sushi", "pizza"]
      };
      const tags = ["italian", "pizza", "sushi", "pasta"];

      const result = filterTags(tags, config);

      expect(result.slice(0, 2)).toContain("sushi");
      expect(result.slice(0, 2)).toContain("pizza");
    });

    it("handles priority tags case-insensitively", () => {
      const config: RestaurantTagConfiguration = {
        ...defaultConfig,
        priorityTags: ["SUSHI"]
      };
      const tags = ["italian", "pizza", "sushi", "pasta"];

      const result = filterTags(tags, config);

      expect(result[0]).toBe("sushi");
    });

    it("handles empty priorityTags array", () => {
      const config: RestaurantTagConfiguration = {
        ...defaultConfig,
        priorityTags: []
      };
      const tags = ["italian", "pizza", "pasta"];

      const result = filterTags(tags, config);

      expect(result).toEqual(tags);
    });
  });

  describe("tag count limiting", () => {
    it("limits tags to maxTags count", () => {
      const config: RestaurantTagConfiguration = {
        ...defaultConfig,
        maxTags: 2
      };
      const tags = ["italian", "pizza", "pasta", "seafood", "wine"];

      const result = filterTags(tags, config);

      expect(result).toHaveLength(2);
      expect(result).toEqual(["italian", "pizza"]);
    });

    it("returns all tags when count is less than maxTags", () => {
      const config: RestaurantTagConfiguration = {
        ...defaultConfig,
        maxTags: 10
      };
      const tags = ["italian", "pizza", "pasta"];

      const result = filterTags(tags, config);

      expect(result).toEqual(tags);
    });

    it("returns all tags when maxTags is 0", () => {
      const config: RestaurantTagConfiguration = {
        ...defaultConfig,
        maxTags: 0
      };
      const tags = ["italian", "pizza", "pasta"];

      const result = filterTags(tags, config);

      expect(result).toEqual(tags);
    });
  });

  describe("combined operations", () => {
    it("applies all filters in correct order", () => {
      const config: RestaurantTagConfiguration = {
        hiddenTags: ["food", "restaurant"],
        maxTags: 3,
        priorityTags: ["sushi"]
      };
      const tags = [
        "italian_restaurant",
        "food",
        "sushi",
        "pizza",
        "restaurant",
        "pasta",
        "wine"
      ];

      const result = filterTags(tags, config);

      expect(result).not.toContain("food");
      expect(result).not.toContain("restaurant");
      expect(result[0]).toBe("sushi");
      expect(result).toHaveLength(3);
    });

    it("handles real-world tag configuration", () => {
      const config: RestaurantTagConfiguration = {
        hiddenTags: ["restaurant", "establishment", "point_of_interest", "food"],
        maxTags: 5,
        priorityTags: ["sushi", "pizza", "burger"]
      };
      const tags = [
        "italian_restaurant",
        "restaurant",
        "establishment",
        "pizza",
        "food",
        "point_of_interest",
        "delivery"
      ];

      const result = filterTags(tags, config);

      expect(result).not.toContain("restaurant");
      expect(result).not.toContain("establishment");
      expect(result).not.toContain("food");
      expect(result).not.toContain("point_of_interest");
      expect(result[0]).toBe("pizza");
    });
  });
});
