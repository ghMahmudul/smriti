import { expect, test } from "@playwright/test";

test.describe("Repeat", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^local$/i }).click();
    await page.getByPlaceholder("Workspace name").fill("Repeat Test");
    await page.getByRole("button", { name: /^create$/i }).click();
    await expect(page.getByText("All Tasks")).toBeVisible();
  });

  test("configures a repeat rule from the date picker", async ({ page }) => {
    await page.getByRole("button", { name: /add task/i }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByRole("button", { name: "Date" }).click();
    await page.getByRole("button", { name: /^repeat$/i }).click();
    await expect(page.getByRole("menu")).toBeVisible();

    await page.getByRole("menuitemradio", { name: "Daily" }).click();
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /repeat: daily/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /repeat: daily/i }).click();
    await page.getByRole("menuitemradio", { name: "Custom" }).click();

    const interval = page.getByRole("spinbutton", { name: "Every" });
    await expect(interval).toBeVisible();
    await interval.fill("3");
    await page.getByRole("button", { name: "Weeks" }).click();

    await expect(
      page.getByRole("button", { name: /repeat: every 3 weeks/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.getByPlaceholder("Next thing to do").fill("Repeat test task");
    await dialog.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Repeat test task")).toBeVisible();
  });
});
