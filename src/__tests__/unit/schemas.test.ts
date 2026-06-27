import { describe, it, expect } from "vitest";
import {
  PatientSchema,
  PatientProfileSchema,
  ProcedureSchema,
  SlotSchema,
  MessageSchema,
  StaffSchema,
  AgentConfigSchema,
  MessageTemplateSchema,
  WorkingHoursSchema,
  FaqItemSchema,
} from "@/lib/validations/schemas";

describe("PatientSchema", () => {
  it("accepts valid patient", () => {
    const result = PatientSchema.safeParse({
      name: "María García",
      phone: "+57 300 123 4567",
      email: "maria@example.com",
      status: "activo",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name < 2 chars", () => {
    const result = PatientSchema.safeParse({ name: "A", phone: "+57 300 123 4567" });
    expect(result.success).toBe(false);
  });

  it("rejects name > 100 chars", () => {
    const result = PatientSchema.safeParse({
      name: "A".repeat(101),
      phone: "+57 300 123 4567",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone format", () => {
    const result = PatientSchema.safeParse({
      name: "María",
      phone: "abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone > 30 chars", () => {
    const result = PatientSchema.safeParse({
      name: "María",
      phone: "+57 300 123 4567 8901 2345 6789 0123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = PatientSchema.safeParse({
      name: "María",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null email and valid phone", () => {
    const result = PatientSchema.safeParse({
      name: "María",
      phone: "+57 300 123 4567",
      email: null,
      status: "prospecto",
    });
    expect(result.success).toBe(true);
  });

  it("trims and lowercases email in StaffSchema", () => {
    const result = StaffSchema.safeParse({
      name: "Dr. Test",
      role: "admin",
      email: "  Test@Example.COM  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
    expect(result.success).toBe(true);
  });
});

describe("SlotSchema", () => {
  it("accepts valid slot with channel enum", () => {
    const result = SlotSchema.safeParse({
      start_at: "2024-03-15T09:00:00Z",
      end_at: "2024-03-15T11:00:00Z",
      block_type: "appointment",
      patient_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      procedure_id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      status: "confirmed",
      channel: "whatsapp",
      notes: "Notas de prueba",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid channel", () => {
    const result = SlotSchema.safeParse({
      start_at: "2024-03-15T09:00:00Z",
      end_at: "2024-03-15T11:00:00Z",
      block_type: "appointment",
      channel: "invalid_channel",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null channel", () => {
    const result = SlotSchema.safeParse({
      start_at: "2024-03-15T09:00:00Z",
      end_at: "2024-03-15T11:00:00Z",
      block_type: "surgery",
      channel: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects notes > 2000 chars", () => {
    const result = SlotSchema.safeParse({
      start_at: "2024-03-15T09:00:00Z",
      end_at: "2024-03-15T11:00:00Z",
      block_type: "appointment",
      notes: "A".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("MessageSchema", () => {
  it("accepts valid message", () => {
    const result = MessageSchema.safeParse({
      patient_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      channel: "whatsapp",
      direction: "in",
      type: "text",
      content: "Hola",
    });
    expect(result.success).toBe(true);
  });

  it("rejects content > 4000 chars", () => {
    const result = MessageSchema.safeParse({
      patient_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      channel: "whatsapp",
      direction: "in",
      type: "text",
      content: "A".repeat(4001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects transcript > 4000 chars", () => {
    const result = MessageSchema.safeParse({
      patient_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      channel: "whatsapp",
      direction: "in",
      type: "text",
      transcript: "A".repeat(4001),
    });
    expect(result.success).toBe(false);
  });
});

describe("ProcedureSchema", () => {
  it("accepts valid procedure", () => {
    const result = ProcedureSchema.safeParse({
      name: "Rinoplastia",
      duration_min: 120,
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative duration", () => {
    const result = ProcedureSchema.safeParse({
      name: "Rinoplastia",
      duration_min: -10,
    });
    expect(result.success).toBe(false);
  });
});

describe("WorkingHoursSchema", () => {
  it("accepts valid working hours", () => {
    const result = WorkingHoursSchema.safeParse({
      mon: ["08:00", "18:00"],
      tue: ["09:00", "17:00"],
      sun: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid time format", () => {
    const result = WorkingHoursSchema.safeParse({
      mon: ["8:00", "18:00"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects out-of-range time", () => {
    const result = WorkingHoursSchema.safeParse({
      mon: ["25:00", "18:00"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid minutes", () => {
    const result = WorkingHoursSchema.safeParse({
      mon: ["08:70", "18:00"],
    });
    expect(result.success).toBe(false);
  });
});

describe("AgentConfigSchema", () => {
  it("accepts valid config", () => {
    const result = AgentConfigSchema.safeParse({
      system_prompt: "Eres un asistente.",
      working_hours: { mon: ["08:00", "18:00"] },
      faq: [{ q: "¿Hola?", a: "¡Hola!" }],
      enabled_channels: ["whatsapp"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects system_prompt > 8000 chars", () => {
    const result = AgentConfigSchema.safeParse({
      system_prompt: "A".repeat(8001),
      working_hours: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("FaqItemSchema", () => {
  it("rejects question > 500 chars", () => {
    const result = FaqItemSchema.safeParse({
      q: "A".repeat(501),
      a: "Respuesta",
    });
    expect(result.success).toBe(false);
  });

  it("rejects answer > 2000 chars", () => {
    const result = FaqItemSchema.safeParse({
      q: "Pregunta",
      a: "A".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("MessageTemplateSchema", () => {
  it("rejects name > 120 chars", () => {
    const result = MessageTemplateSchema.safeParse({
      name: "A".repeat(121),
      type: "confirmation",
      content: "Contenido",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content > 4000 chars", () => {
    const result = MessageTemplateSchema.safeParse({
      name: "Plantilla",
      type: "confirmation",
      content: "A".repeat(4001),
    });
    expect(result.success).toBe(false);
  });
});

describe("PatientProfileSchema", () => {
  it("rejects notes > 5000 chars", () => {
    const result = PatientProfileSchema.safeParse({
      patient_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      notes: "A".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
