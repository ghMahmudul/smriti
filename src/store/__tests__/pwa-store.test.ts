import { beforeEach, describe, expect, it, vi } from "vitest";
import { type BeforeInstallPromptEvent, usePWAStore } from "../pwa-store";

describe("usePWAStore", () => {
  beforeEach(() => {
    usePWAStore.setState({
      isInstallable: false,
      isInstalled: false,
      isIOS: false,
      deferredPrompt: null,
    });
  });

  it("has correct initial default state", () => {
    const state = usePWAStore.getState();
    expect(state.isInstallable).toBe(false);
    expect(state.isInstalled).toBe(false);
    expect(state.deferredPrompt).toBeNull();
  });

  it("updates installable state when deferred prompt is set", () => {
    const mockPromptEvent = {
      platforms: ["web"],
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
      prompt: vi.fn().mockResolvedValue(undefined),
    } as unknown as BeforeInstallPromptEvent;

    usePWAStore.getState().setDeferredPrompt(mockPromptEvent);

    expect(usePWAStore.getState().isInstallable).toBe(true);
    expect(usePWAStore.getState().deferredPrompt).toBe(mockPromptEvent);

    usePWAStore.getState().setDeferredPrompt(null);
    expect(usePWAStore.getState().isInstallable).toBe(false);
  });

  it("handles successful installApp flow", async () => {
    const promptMock = vi.fn().mockResolvedValue(undefined);
    const mockPromptEvent = {
      platforms: ["web"],
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
      prompt: promptMock,
    } as unknown as BeforeInstallPromptEvent;

    usePWAStore.getState().setDeferredPrompt(mockPromptEvent);

    const result = await usePWAStore.getState().installApp();

    expect(promptMock).toHaveBeenCalled();
    expect(result).toBe(true);
    expect(usePWAStore.getState().isInstalled).toBe(true);
    expect(usePWAStore.getState().isInstallable).toBe(false);
    expect(usePWAStore.getState().deferredPrompt).toBeNull();
  });

  it("handles dismissed installApp flow", async () => {
    const promptMock = vi.fn().mockResolvedValue(undefined);
    const mockPromptEvent = {
      platforms: ["web"],
      userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
      prompt: promptMock,
    } as unknown as BeforeInstallPromptEvent;

    usePWAStore.getState().setDeferredPrompt(mockPromptEvent);

    const result = await usePWAStore.getState().installApp();

    expect(promptMock).toHaveBeenCalled();
    expect(result).toBe(false);
    expect(usePWAStore.getState().isInstalled).toBe(false);
  });

  it("returns false from installApp when no prompt is available", async () => {
    const result = await usePWAStore.getState().installApp();
    expect(result).toBe(false);
  });
});
