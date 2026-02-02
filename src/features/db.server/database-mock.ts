import { vi } from "vitest";

import type { DrizzleClient } from "./drizzle";

export function createMockDb(): DrizzleClient {
  return {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    query: {
      searches: {
        findFirst: vi.fn()
      },
      searchCandidates: {
        findFirst: vi.fn()
      }
    }
  } as unknown as DrizzleClient;
}
