import { renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_VERSION } from "@/core/constants";
import { UPDATE_STORAGE_KEY, useAppUpdate } from "../useAppUpdate";

vi.mock("sonner", () => {
  const toastFn = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  });
  return { toast: toastFn };
});

describe("useAppUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("stores the current version and does not show toast on first visit", () => {
    renderHook(() => useAppUpdate());

    expect(localStorage.getItem(UPDATE_STORAGE_KEY)).toBe(APP_VERSION);
    expect(toast).not.toHaveBeenCalled();
  });

  it("does not show toast when the stored version matches current version", () => {
    localStorage.setItem(UPDATE_STORAGE_KEY, APP_VERSION);

    renderHook(() => useAppUpdate());

    expect(toast).not.toHaveBeenCalled();
    expect(localStorage.getItem(UPDATE_STORAGE_KEY)).toBe(APP_VERSION);
  });

  it("shows neutral 'Smriti updated' toast on next launch when version differs", () => {
    localStorage.setItem(UPDATE_STORAGE_KEY, "0.0.1");

    renderHook(() => useAppUpdate());

    expect(toast).toHaveBeenCalledWith("Smriti updated");
    expect(toast.success).not.toHaveBeenCalled();
    expect(localStorage.getItem(UPDATE_STORAGE_KEY)).toBe(APP_VERSION);
  });

  it("handles storage exceptions gracefully without crashing", () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

    expect(() => renderHook(() => useAppUpdate())).not.toThrow();

    getItemSpy.mockRestore();
  });
});
