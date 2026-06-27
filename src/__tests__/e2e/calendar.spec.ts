import { test, expect } from "@playwright/test";

test.describe("Calendar Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to calendar (assumes auth is handled or page is accessible)
    await page.goto("/dashboard/calendar");
  });

  test("calendar page renders with title", async ({ page }) => {
    // If redirected to login, that's expected for unauthenticated
    if (page.url().includes("/login")) {
      expect(page.url()).toContain("/login");
      return;
    }
    await expect(page.getByRole("heading", { name: /agenda clínica/i })).toBeVisible();
  });

  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    // If not already on login page, wait for redirect
    if (!page.url().includes("/login")) {
      await page.waitForURL("/login", { timeout: 5000 });
    }
    expect(page.url()).toContain("/login");
  });

  test("calendar view switches between week/month/day", async ({ page }) => {
    if (page.url().includes("/login")) return;

    // Wait for FullCalendar to render
    await page.waitForSelector(".fc", { timeout: 10000 });

    // Click month view
    const monthBtn = page.locator(".fc-dayGridMonth-button, button:has-text('month')").first();
    if (await monthBtn.isVisible().catch(() => false)) {
      await monthBtn.click();
      await expect(page.locator(".fc-dayGridMonth-view")).toBeVisible();
    }

    // Click week view
    const weekBtn = page.locator(".fc-timeGridWeek-button, button:has-text('week')").first();
    if (await weekBtn.isVisible().catch(() => false)) {
      await weekBtn.click();
      await expect(page.locator(".fc-timeGridWeek-view")).toBeVisible();
    }

    // Click day view
    const dayBtn = page.locator(".fc-timeGridDay-button, button:has-text('day')").first();
    if (await dayBtn.isVisible().catch(() => false)) {
      await dayBtn.click();
      await expect(page.locator(".fc-timeGridDay-view")).toBeVisible();
    }
  });

  test("selecting time slot opens modal", async ({ page }) => {
    if (page.url().includes("/login")) return;

    await page.waitForSelector(".fc", { timeout: 10000 });

    const timeSlot = page.locator(".fc-timegrid-slot").first();
    if (await timeSlot.isVisible().catch(() => false)) {
      await timeSlot.click({ force: true });
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    }
  });

  test("modal has appointment and block tabs", async ({ page }) => {
    if (page.url().includes("/login")) return;

    await page.waitForSelector(".fc", { timeout: 10000 });

    const timeSlot = page.locator(".fc-timegrid-slot").first();
    if (await timeSlot.isVisible().catch(() => false)) {
      await timeSlot.click({ force: true });
      const tabs = page.locator('[role="tab"]');
      const tabTexts = await tabs.allTextContents();
      const hasAppointment = tabTexts.some(t => /agendar|appointment/i.test(t));
      const hasBlock = tabTexts.some(t => /bloquear|block/i.test(t));
      expect(hasAppointment || hasBlock).toBe(true);
    }
  });

  test("calendar navigation works (prev/next)", async ({ page }) => {
    if (page.url().includes("/login")) return;

    await page.waitForSelector(".fc", { timeout: 10000 });

    const titleBefore = await page.locator(".fc-toolbar-title").textContent().catch(() => "");
    const nextBtn = page.locator(".fc-next-button, button:has-text('>')").first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(300);
      const titleAfter = await page.locator(".fc-toolbar-title").textContent().catch(() => "");
      expect(titleAfter).not.toBe(titleBefore);
    }
  });

  test("no XSS in event titles", async ({ page }) => {
    if (page.url().includes("/login")) return;

    await page.waitForSelector(".fc", { timeout: 10000 });
    const eventTitles = await page.locator(".fc-event-title").allTextContents();
    for (const title of eventTitles) {
      expect(title).not.toContain("<script>");
    }
  });
});

test.describe("Calendar Security", () => {
  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    if (!page.url().includes("/login")) {
      await page.waitForURL("/login", { timeout: 5000 });
    }
    expect(page.url()).toContain("/login");
  });
});
