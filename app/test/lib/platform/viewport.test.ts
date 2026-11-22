import { afterEach, describe, expect, it, vi } from "vitest";
import { trackViewport } from "@/lib/platform/viewport.ts";

function fakeViewport(height: number, offsetTop: number) {
  const target = new EventTarget();
  vi.stubGlobal("innerHeight", 800);
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: Object.assign(target, { height, offsetTop }),
  });
}

afterEach(() => {
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute("data-keyboard");
});

describe("trackViewport", () => {
  it("sets the keyboard height to the space the keyboard covers", () => {
    fakeViewport(500, 0);
    trackViewport();
    expect(document.documentElement.style.getPropertyValue("--kb")).toBe("300px");
    expect(document.documentElement.hasAttribute("data-keyboard")).toBe(true);
  });

  it("sets the keyboard height to 0 when no keyboard is up", () => {
    fakeViewport(800, 0);
    trackViewport();
    expect(document.documentElement.style.getPropertyValue("--kb")).toBe("0px");
  });

  it("leaves out the part of the page the viewport has scrolled past", () => {
    fakeViewport(500, 120);
    trackViewport();
    expect(document.documentElement.style.getPropertyValue("--kb")).toBe("180px");
  });
});
