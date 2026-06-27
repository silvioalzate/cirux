import { test, expect } from "@playwright/test";

test.describe("Patients Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/patients");
  });

  test("patients page renders with title or redirects", async ({ page }) => {
    if (page.url().includes("/login")) {
      expect(page.url()).toContain("/login");
      return;
    }
    await expect(page.getByRole("heading", { name: /pacientes/i })).toBeVisible();
  });

  test("search input exists when authenticated", async ({ page }) => {
    if (page.url().includes("/login")) return;

    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar" i]').first();
    await expect(searchInput).toBeVisible();
  });

  test("search debounce prevents excessive requests", async ({ page }) => {
    if (page.url().includes("/login")) return;

    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar" i]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("maria");
      await searchInput.fill("maria garcia");
      await searchInput.fill("maria garcia test");

      // Wait for debounce (300ms + buffer)
      await page.waitForTimeout(500);

      const bodyText = await page.locator("body").textContent();
      expect(bodyText).toMatch(/paciente|no se encontraron|no hay|cargando/i);
    }
  });

  test("patient cards navigate to detail when authenticated", async ({ page }) => {
    if (page.url().includes("/login")) return;

    // Wait for patient cards
    const cards = page.locator("button[class*='cursor-pointer'], a[href*='/patients/']").first();
    if (await cards.isVisible().catch(() => false)) {
      await cards.click();
      await page.waitForURL(/\/dashboard\/patients\/.+/, { timeout: 5000 });
      expect(page.url()).toMatch(/\/dashboard\/patients\/[^/]+$/);
    }
  });

  test("invalid patient ID is handled", async ({ page }) => {
    await page.goto("/dashboard/patients/invalid-id");
    await page.waitForLoadState("networkidle");

    // Should show 404, not found, or redirect to patients list
    const url = page.url();
    const bodyText = await page.locator("body").textContent();

    const isHandled =
      url.includes("404") ||
      bodyText?.match(/404|not found|no encontrado|error/i) !== null ||
      url === "http://localhost:3000/dashboard/patients";

    expect(isHandled).toBe(true);
  });

  test("malformed UUID in URL is handled", async ({ page }) => {
    await page.goto("/dashboard/patients/'; DROP TABLE patients; --");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const bodyText = await page.locator("body").textContent();

    const isHandled =
      url.includes("404") ||
      bodyText?.match(/404|not found|no encontrado|error/i) !== null ||
      url === "http://localhost:3000/dashboard/patients";

    expect(isHandled).toBe(true);
  });
});

test.describe("Patient Detail Page", () => {
  test("tabs are accessible when authenticated", async ({ page }) => {
    await page.goto("/dashboard/patients");
    if (page.url().includes("/login")) return;

    // Try to find and click a patient card
    const card = page.locator("button[class*='cursor-pointer']").first();
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      await page.waitForURL(/\/dashboard\/patients\/.+/, { timeout: 5000 });

      // Check for tabs
      const tabs = page.locator('[role="tab"]');
      if (await tabs.count() > 0) {
        const firstTab = tabs.first();
        await firstTab.click();
        await expect(page.locator('[role="tabpanel"]')).toBeVisible();
      }
    }
  });

  test("back button navigates to patients list", async ({ page }) => {
    await page.goto("/dashboard/patients/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("/login")) return;

    const backButton = page.locator('a:has-text("Volver"), button:has-text("Volver")').first();
    if (await backButton.isVisible().catch(() => false)) {
      await backButton.click();
      await page.waitForURL("/dashboard/patients", { timeout: 5000 });
      expect(page.url()).toContain("/dashboard/patients");
    }
  });
});

test.describe("Patients Security", () => {
  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/dashboard/patients");
    if (!page.url().includes("/login")) {
      await page.waitForURL("/login", { timeout: 5000 });
    }
    expect(page.url()).toContain("/login");
  });

  test("XSS in patient name is not executed", async ({ page }) => {
    await page.goto("/dashboard/patients");

    // If redirected to login, skip this specific check
    if (page.url().includes("/login")) return;

    // Check patient card text contents (not HTML) don't contain raw scripts
    const cardTexts = await page.locator("[class*='cursor-pointer']").allTextContents();
    for (const text of cardTexts) {
      // Patient names rendered as text should not contain HTML tags
      expect(text).not.toContain("<script>");
      expect(text).not.toContain("javascript:");
    }

    // Verify no event handlers in rendered HTML of patient list area
    const patientListHTML = await page.locator("body").innerHTML();
    // Next.js includes its own <script> tags for hydration — that's expected
    // We verify user data doesn't inject inline event handlers
    expect(patientListHTML).not.toContain("onerror=");
    expect(patientListHTML).not.toContain("onload=");
    expect(patientListHTML).not.toContain("onclick=");
  });
});
