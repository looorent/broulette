import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDeviceLocation, getGeolocationPermissionStatus, isGeolocationSupported } from "./geolocation";

describe("isGeolocationSupported", () => {
  it("returns true when geolocation is available", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        geolocation: {
          getCurrentPosition: vi.fn()
        }
      },
      writable: true
    });

    expect(isGeolocationSupported()).toBe(true);
  });

  it("returns false when navigator is undefined", () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      writable: true
    });

    expect(isGeolocationSupported()).toBe(false);

    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true
    });
  });

  it("returns false when geolocation is not available", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      writable: true
    });

    expect(isGeolocationSupported()).toBe(false);
  });
});

describe("getGeolocationPermissionStatus", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        geolocation: {
          getCurrentPosition: vi.fn()
        },
        permissions: {
          query: vi.fn()
        }
      },
      writable: true
    });
  });

  it("returns granted when permission is granted", async () => {
    vi.mocked(navigator.permissions.query).mockResolvedValue({
      state: "granted",
      name: "geolocation",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    });

    const status = await getGeolocationPermissionStatus();

    expect(status).toBe("granted");
    expect(navigator.permissions.query).toHaveBeenCalledWith({ name: "geolocation" });
  });

  it("returns denied when permission is denied", async () => {
    vi.mocked(navigator.permissions.query).mockResolvedValue({
      state: "denied",
      name: "geolocation",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    });

    const status = await getGeolocationPermissionStatus();

    expect(status).toBe("denied");
  });

  it("returns prompt when permission is prompt", async () => {
    vi.mocked(navigator.permissions.query).mockResolvedValue({
      state: "prompt",
      name: "geolocation",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    });

    const status = await getGeolocationPermissionStatus();

    expect(status).toBe("prompt");
  });

  it("returns unknown when query throws", async () => {
    vi.mocked(navigator.permissions.query).mockRejectedValue(new Error("Not supported"));

    const status = await getGeolocationPermissionStatus();

    expect(status).toBe("unknown");
  });

  it("returns unknown when permissions API is not available", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        geolocation: {
          getCurrentPosition: vi.fn()
        }
      },
      writable: true
    });

    const status = await getGeolocationPermissionStatus();

    expect(status).toBe("unknown");
  });

  it("returns unknown when navigator is undefined", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      writable: true
    });

    const status = await getGeolocationPermissionStatus();

    expect(status).toBe("unknown");
  });
});

describe("getDeviceLocation", () => {
  let mockGetCurrentPosition: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetCurrentPosition = vi.fn();
    Object.defineProperty(globalThis, "navigator", {
      value: {
        geolocation: {
          getCurrentPosition: mockGetCurrentPosition
        }
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("resolves with position on first attempt success (cached)", async () => {
    const mockPosition: GeolocationPosition = {
      coords: {
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({})
      },
      timestamp: Date.now(),
      toJSON: () => ({})
    };

    mockGetCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const position = await getDeviceLocation();

    expect(position).toBe(mockPosition);
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("falls back to high accuracy on first failure", async () => {
    const mockPosition: GeolocationPosition = {
      coords: {
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({})
      },
      timestamp: Date.now(),
      toJSON: () => ({})
    };

    mockGetCurrentPosition
      .mockImplementationOnce((_, error) => error(new Error("Cached failed")))
      .mockImplementationOnce((success) => success(mockPosition));

    const position = await getDeviceLocation();

    expect(position).toBe(mockPosition);
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it("falls back to low accuracy on high accuracy timeout", async () => {
    const mockPosition: GeolocationPosition = {
      coords: {
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 100,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({})
      },
      timestamp: Date.now(),
      toJSON: () => ({})
    };

    const timeoutError = {
      code: 3,
      TIMEOUT: 3,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      message: "Timeout"
    };

    mockGetCurrentPosition
      .mockImplementationOnce((_, error) => error(new Error("Cached failed")))
      .mockImplementationOnce((_, error) => error(timeoutError))
      .mockImplementationOnce((success) => success(mockPosition));

    const position = await getDeviceLocation();

    expect(position).toBe(mockPosition);
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(3);
  });

  it("rejects when geolocation is not supported", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      writable: true
    });

    await expect(getDeviceLocation()).rejects.toThrow("Geolocation not supported");
  });

  it("rejects when all attempts fail", async () => {
    const timeoutError = {
      code: 3,
      TIMEOUT: 3,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      message: "Timeout"
    };

    const lowAccuracyError = {
      code: 2,
      TIMEOUT: 3,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      message: "Position unavailable"
    };

    mockGetCurrentPosition
      .mockImplementationOnce((_, error) => error(new Error("Cached failed")))
      .mockImplementationOnce((_, error) => error(timeoutError))
      .mockImplementationOnce((_, error) => error(lowAccuracyError));

    await expect(getDeviceLocation()).rejects.toBeDefined();
  });

  it("rejects immediately on permission denied", async () => {
    const permissionError = {
      code: 1,
      TIMEOUT: 3,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      message: "Permission denied"
    };

    mockGetCurrentPosition
      .mockImplementationOnce((_, error) => error(new Error("Cached failed")))
      .mockImplementationOnce((_, error) => error(permissionError));

    await expect(getDeviceLocation()).rejects.toEqual(permissionError);
  });
});
