import { describe, expect, it } from "vitest";
import { getCaretCoordinates } from "../caret";

describe("getCaretCoordinates", () => {
  it("returns coordinates for textarea element", () => {
    const textarea = document.createElement("textarea");
    textarea.value = "Hello world";
    document.body.appendChild(textarea);

    const coords = getCaretCoordinates(textarea, 5);
    expect(coords).toBeDefined();
    expect(typeof coords.top).toBe("number");
    expect(typeof coords.left).toBe("number");
    expect(typeof coords.height).toBe("number");
    expect(coords.height).toBeGreaterThan(0);

    document.body.removeChild(textarea);
  });

  it("returns coordinates for input element", () => {
    const input = document.createElement("input");
    input.value = "Hello world";
    document.body.appendChild(input);

    const coords = getCaretCoordinates(input, 5);
    expect(coords).toBeDefined();
    expect(typeof coords.top).toBe("number");
    expect(typeof coords.left).toBe("number");
    expect(typeof coords.height).toBe("number");

    document.body.removeChild(input);
  });
});
