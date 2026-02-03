import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("@features/utils/logger", () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

afterEach(() => {
  cleanup();
});

const mockCryptoKey = {
  type: "secret",
  extractable: false,
  algorithm: { name: "HMAC", hash: { name: "SHA-256" } },
  usages: ["sign", "verify"]
};

Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: () => "test-uuid-" + Math.random().toString(36).substring(2, 9),
    getRandomValues: <T extends ArrayBufferView>(array: T): T => {
      if (array instanceof Uint8Array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      }
      return array;
    },
    subtle: {
      importKey: vi.fn().mockResolvedValue(mockCryptoKey),
      sign: vi.fn().mockImplementation(async (_algorithm, _key, data) => {
        // Return a deterministic hash based on the data for testing
        const dataArray = new Uint8Array(data);
        const hash = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          hash[i] = dataArray[i % dataArray.length] ^ (i * 7);
        }
        return hash.buffer;
      }),
      verify: vi.fn().mockResolvedValue(true)
    }
  }
});

const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};

Object.defineProperty(globalThis, "navigator", {
  value: {
    geolocation: mockGeolocation,
    permissions: {
      query: vi.fn()
    }
  },
  writable: true
});
