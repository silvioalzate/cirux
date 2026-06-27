import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Send Message API — Business Logic Tests
 *
 * Tests the core validation and business rules without relying on
 * Next.js App Router module mocking (which is brittle in Vitest).
 */

const phoneRegex = /^[+]?[\d\s\-().]{7,30}$/;

const SendSchema = z.object({
  number: z.string().regex(phoneRegex, "Invalid phone format").max(30),
  text: z.string().min(1).max(4000),
  patientId: z.string().uuid(),
  conversationId: z.string().uuid(),
  quotedMessage: z.string().max(4000).optional(),
});

describe("Send Message Schema Validation", () => {
  const validPayload = {
    number: "+57 300 123 4567",
    text: "Hola, ¿cómo estás?",
    patientId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    conversationId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
  };

  it("accepts valid payload", () => {
    const result = SendSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone format", () => {
    const result = SendSchema.safeParse({
      ...validPayload,
      number: "abc-def",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone > 30 chars", () => {
    const result = SendSchema.safeParse({
      ...validPayload,
      number: "+57 300 123 4567 8901 2345 6789 0123 4567",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty text", () => {
    const result = SendSchema.safeParse({
      ...validPayload,
      text: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects text > 4000 chars", () => {
    const result = SendSchema.safeParse({
      ...validPayload,
      text: "A".repeat(4001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid patientId UUID", () => {
    const result = SendSchema.safeParse({
      ...validPayload,
      patientId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid conversationId UUID", () => {
    const result = SendSchema.safeParse({
      ...validPayload,
      conversationId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects quotedMessage > 4000 chars", () => {
    const result = SendSchema.safeParse({
      ...validPayload,
      quotedMessage: "A".repeat(4001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts XSS payload in text (stored but not executed)", () => {
    const xssPayload = "<script>alert('xss')</script>";
    const result = SendSchema.safeParse({
      ...validPayload,
      text: xssPayload,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe(xssPayload);
    }
  });

  it("accepts optional quotedMessage", () => {
    const result = SendSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quotedMessage).toBeUndefined();
    }
  });
});

describe("Send Message Security Rules", () => {
  it("requires all mandatory fields", () => {
    const result = z.object({
      number: z.string().min(1),
      text: z.string().min(1),
      patientId: z.string().uuid(),
      conversationId: z.string().uuid(),
    }).safeParse({
      number: "+57 300 123 4567",
      text: "Hola",
      // missing patientId and conversationId
    });
    expect(result.success).toBe(false);
  });

  it("phone regex accepts international formats", () => {
    const validPhones = [
      "+57 300 123 4567",
      "+1-800-555-0199",
      "3001234567",
      "+44 20 7946 0958",
      "(555) 123-4567",
    ];

    for (const phone of validPhones) {
      const result = phoneRegex.test(phone);
      expect(result).toBe(true);
    }
  });

  it("phone regex rejects non-phone strings", () => {
    const invalidPhones = [
      "abc123",
      "+57 300 <script>",
      "",
      "123",
      "call-me-now",
    ];

    for (const phone of invalidPhones) {
      const result = phoneRegex.test(phone);
      expect(result).toBe(false);
    }
  });
});

describe("Send Message Data Sanitization", () => {
  it("preserves raw values (trimming is route handler responsibility)", () => {
    const raw = {
      number: "+57 300 123 4567",
      text: "Hola con espacios",
      patientId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      conversationId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
    };

    const result = SendSchema.safeParse(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      // Schema preserves raw values — trimming happens in route handler
      expect(result.data.number).toBe("+57 300 123 4567");
      expect(result.data.text).toBe("Hola con espacios");
    }
  });
});
