import type {
  Patient,
  Slot,
  Message,
  Conversation,
  Procedure,
  Staff,
  AgentConfig,
  MessageTemplate,
} from "@/lib/types";

// ─── Reusable test fixtures ────────────────────────────────────────────────

export const testPatient: Patient = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  name: "María García",
  phone: "+57 300 123 4567",
  email: "maria@example.com",
  status: "activo",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

export const testProspect: Patient = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
  name: "Carlos López",
  phone: "+57 310 987 6543",
  email: null,
  status: "prospecto",
  created_at: "2024-02-20T14:30:00Z",
  updated_at: "2024-02-20T14:30:00Z",
};

export const testProcedure: Procedure = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13",
  name: "Rinoplastia",
  description: "Cirugía de nariz estética y funcional",
  duration_min: 120,
  preparation_notes: "Ayuno 8h previo",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const testSlot: Slot = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14",
  start_at: "2024-03-15T09:00:00Z",
  end_at: "2024-03-15T11:00:00Z",
  block_type: "appointment",
  patient_id: testPatient.id,
  procedure_id: testProcedure.id,
  status: "confirmed",
  channel: "whatsapp",
  notes: null,
  created_at: "2024-03-01T10:00:00Z",
  updated_at: "2024-03-01T10:00:00Z",
};

export const testBlockSlot: Slot = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15",
  start_at: "2024-03-16T08:00:00Z",
  end_at: "2024-03-16T18:00:00Z",
  block_type: "surgery",
  patient_id: null,
  procedure_id: null,
  status: "blocked",
  channel: null,
  notes: "Bloqueo quirófano",
  created_at: "2024-03-01T10:00:00Z",
  updated_at: "2024-03-01T10:00:00Z",
};

export const testConversation: Conversation = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16",
  patient_id: testPatient.id,
  channel: "whatsapp",
  status: "pending_human",
  ai_context: null,
  last_message_at: "2024-03-15T10:00:00Z",
  created_at: "2024-03-10T08:00:00Z",
  updated_at: "2024-03-15T10:00:00Z",
};

export const testMessage: Message = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17",
  patient_id: testPatient.id,
  conversation_id: testConversation.id,
  channel: "whatsapp",
  direction: "in",
  type: "text",
  content: "Hola, quiero agendar una cita",
  audio_url: null,
  transcript: "Hola, quiero agendar una cita",
  created_at: "2024-03-15T10:00:00Z",
};

export const testStaff: Staff = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18",
  name: "Dr. Silvio Alzate",
  role: "admin",
  email: "silvioalzate@gmail.com",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const testAgentConfig: AgentConfig = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19",
  system_prompt: "Eres un asistente de una clínica de cirugía plástica.",
  working_hours: {
    mon: ["08:00", "18:00"],
    tue: ["08:00", "18:00"],
    wed: ["08:00", "18:00"],
    thu: ["08:00", "18:00"],
    fri: ["08:00", "18:00"],
    sat: ["08:00", "13:00"],
    sun: null,
  },
  faq: [
    { q: "¿Cuánto dura la recuperación?", a: "Depende del procedimiento, generalmente 1-2 semanas." },
  ],
  enabled_channels: ["whatsapp", "web"],
  updated_at: "2024-01-01T00:00:00Z",
};

export const testTemplate: MessageTemplate = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1a",
  name: "Confirmación de cita",
  type: "confirmation",
  content: "Hola {nombre}, tu cita para {procedimiento} está confirmada para el {fecha} a las {hora}.",
  channel: "whatsapp",
  is_active: true,
};

// ─── Test data builders ────────────────────────────────────────────────────

export function buildPatient(overrides: Partial<Patient> = {}): Patient {
  return {
    ...testPatient,
    id: crypto.randomUUID(),
    ...overrides,
  };
}

export function buildSlot(overrides: Partial<Slot> = {}): Slot {
  return {
    ...testSlot,
    id: crypto.randomUUID(),
    ...overrides,
  };
}

export function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    ...testMessage,
    id: crypto.randomUUID(),
    ...overrides,
  };
}
