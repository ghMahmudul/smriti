import { test, expect } from "@playwright/test"

test.describe("Workspace", () => {
  test("shows workspace picker on first visit", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Smriti", level: 1 })).toBeVisible()
    await expect(page.getByText("A task management app powered by .todo files")).toBeVisible()
  })

  test("can create a local storage workspace", async ({ page }) => {
    await page.goto("/")

    await page.getByRole("button", { name: /^local$/i }).click()
    const nameInput = page.getByPlaceholder("Workspace name")
    await nameInput.fill("Test Workspace")
    await page.getByRole("button", { name: /^create$/i }).click()

    await expect(page.getByText("All Tasks")).toBeVisible()
  })

  test("opening manage workspace updates the URL to /workspaces", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /^local$/i }).click()
    const nameInput = page.getByPlaceholder("Workspace name")
    await nameInput.fill("Test Workspace")
    await page.getByRole("button", { name: /^create$/i }).click()
    await expect(page.getByText("All Tasks")).toBeVisible()
    await expect(page).toHaveURL(/\/all$/)

    // Open workspace dropdown in sidebar and click Manage Workspaces
    await page.getByRole("button", { name: /Test Workspace/i }).click()
    await page.getByRole("menuitem", { name: /Manage Workspaces/i }).click()

    await expect(page).toHaveURL(/\/workspaces$/)
    await expect(page.getByRole("heading", { name: "Smriti", level: 1 })).toBeVisible()

    // Returning to workspace via close button updates the URL
    await page.getByRole("button", { name: "Close" }).click()
    await expect(page).toHaveURL(/\/all$/)
    await expect(page.getByText("All Tasks")).toBeVisible()
  })

  test("opening manage workspace on mobile closes sidebar and returns to task view with closed sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")
    await page.getByRole("button", { name: /^local$/i }).click()
    const nameInput = page.getByPlaceholder("Workspace name")
    await nameInput.fill("Mobile Workspace")
    await page.getByRole("button", { name: /^create$/i }).click()
    await expect(page.getByText("All Tasks")).toBeVisible()

    // Open sidebar on mobile via header toggle button
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
    await expect(page.getByRole("button", { name: "Close sidebar" })).toBeVisible()

    // Open workspace dropdown in sidebar and click Manage Workspaces
    await page.getByRole("button", { name: /Mobile Workspace/i }).click()
    await page.getByRole("menuitem", { name: /Manage Workspaces/i }).click()

    await expect(page).toHaveURL(/\/workspaces$/)
    await expect(page.getByRole("heading", { name: "Smriti", level: 1 })).toBeVisible()

    // Returning to workspace via close button returns to task view with closed sidebar
    await page.getByRole("button", { name: "Close" }).click()
    await expect(page).toHaveURL(/\/all$/)
    await expect(page.getByRole("button", { name: "Toggle sidebar" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Close sidebar" })).not.toBeVisible()
  })

  test("changing workspace from dropdown updates the URL to default view", async ({ page }) => {
    // 1. Create Workspace A
    await page.goto("/")
    await page.getByRole("button", { name: /^local$/i }).click()
    await page.getByPlaceholder("Workspace name").fill("Workspace A")
    await page.getByRole("button", { name: /^create$/i }).click()
    await expect(page.getByText("All Tasks")).toBeVisible()
    await expect(page).toHaveURL(/\/all$/)

    // 2. Open /workspaces and create Workspace B
    await page.getByRole("button", { name: /Workspace A/i }).click()
    await page.getByRole("menuitem", { name: /Manage Workspaces/i }).click()
    await expect(page).toHaveURL(/\/workspaces$/)

    await page.getByRole("button", { name: /^local$/i }).click()
    await page.getByPlaceholder("Workspace name").fill("Workspace B")
    await page.getByRole("button", { name: /^create$/i }).click()
    await expect(page.getByText("All Tasks")).toBeVisible()
    await expect(page).toHaveURL(/\/all$/)

    // 3. Navigate away from default view (e.g. to /completed)
    await page.goto("/completed")
    await expect(page).toHaveURL(/\/completed$/)

    // 4. Change workspace back to Workspace A from sidebar dropdown
    await page.getByRole("button", { name: /Workspace B/i }).click()
    await page.getByRole("menuitem", { name: /Workspace A/i }).click()

    // 5. Verify URL changed to Workspace A's default view (/all)
    await expect(page).toHaveURL(/\/all$/)
    await expect(page.getByText("All Tasks")).toBeVisible()
  })
})


test.describe("Task CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /^local$/i }).click()
    const nameInput = page.getByPlaceholder("Workspace name")
    await nameInput.fill("Test Workspace")
    await page.getByRole("button", { name: /^create$/i }).click()
    await expect(page.getByText("All Tasks")).toBeVisible()
  })

  test("can create a new task", async ({ page }) => {
    await page.getByRole("button", { name: /add task/i }).click()

    const titleInput = page.getByPlaceholder("Next thing to do")
    await titleInput.fill("Buy groceries")

    await page.getByRole("button", { name: /^add$/i }).click()
    await expect(page.getByText("Buy groceries")).toBeVisible()
  })

  test("can toggle task completion", async ({ page }) => {
    await page.getByRole("button", { name: /add task/i }).click()
    await page.getByPlaceholder("Next thing to do").fill("Test task")
    await page.getByRole("button", { name: /^add$/i }).click()

    await expect(page.getByText("Test task")).toBeVisible()

    const checkbox = page.getByRole("button", { name: "Mark as done", exact: true })
    await checkbox.click()

    await page.goto("/completed")

    await expect(page.getByText("Test task")).toHaveClass(/text-muted-foreground/)
    await expect(page.getByText("Test task")).not.toHaveCSS(
      "text-decoration-line",
      "line-through",
    )
  })

  test("can navigate between views", async ({ page }) => {
    await page.getByRole("button", { name: /inbox/i }).first().click()
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible()

    await page.getByRole("button", { name: /today/i }).first().click()
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible()
  })

  test("preserves tasks immediately on refresh without content blink", async ({ page }) => {
    await page.getByRole("button", { name: /add task/i }).click()
    await page.getByPlaceholder("Next thing to do").fill("Persistent task")
    await page.getByRole("button", { name: /^add$/i }).click()
    await expect(page.getByText("Persistent task")).toBeVisible()

    await page.reload()

    await expect(page.getByText("Persistent task")).toBeVisible()
    await expect(page.getByText("All Tasks")).toBeVisible()
  })
})

test.describe("Settings Modal", () => {
  test("opens full screen on mobile screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")
    await page.getByRole("button", { name: /^local$/i }).click()
    await page.getByPlaceholder("Workspace name").fill("Mobile Workspace")
    await page.getByRole("button", { name: /^create$/i }).click()
    await expect(page.getByText("All Tasks")).toBeVisible()

    // Open sidebar on mobile
    await page.getByRole("button", { name: "Toggle sidebar" }).click()

    // Click settings button at bottom of sidebar
    await page.getByRole("button", { name: "Settings" }).click()

    // Find the settings dialog
    const dialog = page.locator('[data-slot="dialog-content"]')
    await expect(dialog).toBeVisible()

    // Verify it occupies full screen on mobile (width: 375, height: 667)
    await expect(async () => {
      const box = await dialog.boundingBox()
      expect(box).not.toBeNull()
      expect(box?.x).toBe(0)
      expect(box?.y).toBe(0)
      expect(box?.width).toBe(375)
      expect(box?.height).toBe(667)
    }).toPass()

    // Verify all settings sections are shown on one page without navigation options
    await expect(page.getByText("Workspace name")).toBeVisible()
    await expect(page.getByText("Default view")).toBeVisible()
    await expect(page.getByText("Theme")).toBeVisible()

    // No navigation option buttons for sections
    await expect(page.getByRole("button", { name: /^general$/i })).not.toBeVisible()
    await expect(page.getByRole("button", { name: /^appearance$/i })).not.toBeVisible()
    await expect(page.getByRole("button", { name: /^views$/i })).not.toBeVisible()

    // Close button closes settings
    await page.locator('[data-slot="dialog-close"]').click()
    await expect(dialog).not.toBeVisible()
  })

  test("opens centered modal on desktop screen", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/")
    await page.getByRole("button", { name: /^local$/i }).click()
    await page.getByPlaceholder("Workspace name").fill("Desktop Workspace")
    await page.getByRole("button", { name: /^create$/i }).click()
    await expect(page.getByText("All Tasks")).toBeVisible()

    // Click settings button in sidebar
    await page.getByRole("button", { name: "Settings" }).click()

    const dialog = page.locator('[data-slot="dialog-content"]')
    await expect(dialog).toBeVisible()

    const box = await dialog.boundingBox()
    expect(box).not.toBeNull()
    // Centered and not full screen
    expect(box?.x).toBeGreaterThan(0)
    expect(box?.y).toBeGreaterThan(0)
    expect(box?.width).toBeLessThan(1280)
    expect(box?.height).toBeLessThan(800)
  })
})
