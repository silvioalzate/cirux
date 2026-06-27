import { expect } from "vitest";

/**
 * Helper to test Next.js App Router API routes.
 * Creates a Request object and extracts the Response.
 */

export function createTestRequest(
  options: {
    method?: string;
    url?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = "POST", url = "http://localhost/api/test", body, headers = {} } = options;

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  return new Request(url, init);
}

export async function parseJsonResponse(response: Response): Promise<unknown> {
  return response.json();
}

export function expectJsonResponse(response: Response, expectedStatus: number) {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get("content-type")?.toLowerCase()).toContain("application/json");
}
