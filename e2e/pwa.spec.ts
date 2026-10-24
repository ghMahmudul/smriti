import { expect, test } from "@playwright/test";

test.describe("PWA Features & Manifest", () => {
  test("serves a valid web app manifest with required PWA fields", async ({
    request,
  }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBe(true);

    const manifest = await response.json();
    expect(manifest.name).toBe("Smriti");
    expect(manifest.short_name).toBe("Smriti");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.theme_color).toBe("#ffffff");
    expect(manifest.background_color).toBe("#09090b");

    // Icons validation
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);

    const icon192 = manifest.icons.find(
      (icon: { sizes?: string; purpose?: string }) =>
        icon.sizes === "192x192" && !icon.purpose,
    );
    expect(icon192).toBeDefined();

    const icon512 = manifest.icons.find(
      (icon: { sizes?: string; purpose?: string }) =>
        icon.sizes === "512x512" && !icon.purpose,
    );
    expect(icon512).toBeDefined();

    const maskableIcon = manifest.icons.find(
      (icon: { purpose?: string }) => icon.purpose === "maskable",
    );
    expect(maskableIcon).toBeDefined();

    // Shortcuts validation
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(2);
  });

  test("serves all required PWA icons and assets with 200 OK", async ({
    request,
  }) => {
    const iconUrls = [
      "/favicon.svg",
      "/favicon.ico",
      "/pwa-64x64.png",
      "/pwa-192x192.png",
      "/pwa-512x512.png",
      "/maskable-icon-192x192.png",
      "/maskable-icon-512x512.png",
      "/apple-touch-icon.png",
    ];

    for (const url of iconUrls) {
      const response = await request.get(url);
      expect(response.ok(), `Icon ${url} should return 200 OK`).toBe(true);
    }
  });

  test("renders required PWA meta tags in HTML head", async ({ page }) => {
    await page.goto("/");

    // Apple touch icon
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon).toHaveAttribute("href", "/apple-touch-icon.png");

    // iOS Web App Capable
    const appleCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleCapable).toHaveAttribute("content", "yes");

    // iOS Status bar style
    const statusBar = page.locator(
      'meta[name="apple-mobile-web-app-status-bar-style"]',
    );
    await expect(statusBar).toHaveAttribute("content", "default");

    // Theme color
    const themeColor = page.locator('meta[name="theme-color"]:not([media])');
    await expect(themeColor).toHaveAttribute("content", "#ffffff");

    // Viewport with cover
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute(
      "content",
      /viewport-fit=cover/,
    );
  });
});
