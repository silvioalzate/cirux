import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// ─── Global test setup ─────────────────────────────────────────────────────

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard/calendar",
  redirect: vi.fn(),
}));

// Mock next/headers (server-only)
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      getAll: () => [],
      set: vi.fn(),
      get: () => undefined,
    }),
}));

// Suppress console.error in tests unless explicitly testing error paths
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  // Filter out known React warnings in test environment
  const msg = String(args[0] ?? "");
  if (
    msg.includes("Warning: ReactDOMTestUtils.act") ||
    msg.includes("not wrapped in act")
  ) {
    return;
  }
  originalConsoleError(...args);
};
