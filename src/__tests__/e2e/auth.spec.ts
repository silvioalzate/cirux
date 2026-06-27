import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("login page renders correctly", async ({ page }) => {
    await expect(page.getByText(/iniciar sesión/i)).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole("button", { name: /ingresar/i })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.locator('input#email').fill("invalid@example.com");
    await page.locator('input#password').fill("wrongpassword123");
    await page.getByRole("button", { name: /ingresar/i }).click();

    // Wait for toast or error message
    await page.waitForTimeout(500);
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toMatch(/credenciales inválidas|error/i);
  });

  test("redirects to login when accessing dashboard unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });

  test("redirects unauthenticated admin routes to login", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });

  test("password visibility toggle works", async ({ page }) => {
    const passwordInput = page.locator('input#password');
    await passwordInput.fill("secret123");

    // Initially hidden
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click show password button (aria-label)
    const toggleBtn = page.locator('button[aria-label*="contraseña" i]');
    if (await toggleBtn.isVisible().catch(() => false)) {
      await toggleBtn.click();
      await expect(passwordInput).toHaveAttribute("type", "text");

      // Click hide password
      await toggleBtn.click();
      await expect(passwordInput).toHaveAttribute("type", "password");
    }
  });

  test("login form has autocomplete on password", async ({ page }) => {
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
  });
});

test.describe("Session Security", () => {
  test("dashboard requires authentication", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });

  test("API routes return 401 without auth", async ({ request }) => {
    const response = await request.post("/api/v1/send-message", {
      data: { text: "test" },
    });
    expect(response.status()).toBe(401);
  });

  test("API routes return 401 without auth (appointment-logic)", async ({ request }) => {
    const response = await request.post("/api/v1/appointment-logic", {
      data: { query: "test", target_date: "2024-03-15" },
    });
    expect(response.status()).toBe(401);
  });
});
