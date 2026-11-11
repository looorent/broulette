import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home, { loader } from "./_index";

vi.mock("@features/browser.client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@features/browser.client")>();
  return {
    ...original,
    getDeviceLocation: vi.fn().mockResolvedValue(undefined),
    getGeolocationPermissionStatus: vi.fn().mockResolvedValue("denied")
  };
});

const STORAGE_KEY = "broulette_preferences";
const storedPreferences = {
  version: 2,
  distanceRangeId: "Far",
  avoidFastFood: false,
  avoidTakeaway: false,
  onlyHighRated: true,
  location: {
    type: "address",
    label: { display: "Namur, Belgium", compact: "Namur" },
    coordinates: { latitude: 50.4652, longitude: 4.8655 }
  }
};

async function renderHomeOnServer() {
  const loaderData = await loader();
  const Stub = createRoutesStub([{ id: "home", path: "/", Component: Home, loader: () => loaderData }]);
  const element = <Stub initialEntries={["/"]} hydrationData={{ loaderData: { home: loaderData } }} />;
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  document.body.appendChild(container);
  return { element, container };
}

describe("Home page hydration", () => {
  afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("hydrates without mismatch and then restores the stored preferences", async () => {
    const { element, container } = await renderHomeOnServer();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedPreferences));
    const onRecoverableError = vi.fn();

    await act(async () => {
      hydrateRoot(container, element, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Namur");
  });

  it("does not overwrite the stored preferences with the defaults while restoring them", async () => {
    const { element, container } = await renderHomeOnServer();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedPreferences));

    await act(async () => {
      hydrateRoot(container, element);
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      distanceRangeId: "Far",
      location: { type: "address", label: { compact: "Namur" } }
    });
  });
});
