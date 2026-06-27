import { z } from 'zod';

// ─── Enums matching DB constraints ─────────────────────────────────────

const patientStatusEnum = z.enum(["prospecto", "activo", "inactivo"]);
const slotStatusEnum = z.enum(["available", "confirmed", "cancelled", "completed", "reschedule", "blocked"]);
const blockTypeEnum = z.enum(["surgery", "admin", "vacation", "event", "appointment"]);
const messageDirectionEnum = z.enum(["in", "out"]);
const messageTypeEnum = z.enum(["text", "audio", "image", "document"]);
const conversationStatusEnum = z.enum(["active", "pending_human", "resolved"]);
const channelEnum = z.enum(["whatsapp", "messenger", "instagram", "tiktok", "web", "manual"]);
const templateTypeEnum = z.enum(["confirmation", "reminder", "reschedule", "post_op", "notification", "news", "surgeon_instructions"]);
const notificationTypeEnum = z.enum([
  "new_appointment",
  "appointment_cancelled",
  "human_handoff",
  "new_patient",
  "appointment_reminder_2h",
  "daily_summary",
  "appointment_rescheduled",
  "appointment_reminder_next_day",
]);

// ─── Domain Schemas ─────────────────────────────────────────────────────

const phoneRegex = /^[+]?[\d\s\-().]{7,30}$/;

export const PatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long").trim(),
  phone: z.string().regex(phoneRegex, "Invalid phone format").max(30),
  email: z.string().email("Invalid email").max(255).optional().nullable(),
  status: patientStatusEnum.default("prospecto"),
});

export const PatientFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long").trim(),
  phone: z.string().regex(phoneRegex, "Invalid phone format").max(30),
  email: z.string().email("Invalid email").max(255).nullable(),
  status: patientStatusEnum,
});

export const PatientProfileSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  interested_procedures: z.array(z.string().max(100)).default([]),
  notes: z.string().max(5000).optional().nullable(),
  last_interaction: z.string().datetime().optional().nullable(),
});

export const ProcedureSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Procedure name is required").max(120),
  description: z.string().max(2000).optional().nullable(),
  duration_min: z.number().int().positive("Duration is required"),
  preparation_notes: z.string().max(2000).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const SlotSchema = z.object({
  id: z.string().uuid().optional(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  block_type: blockTypeEnum,
  patient_id: z.string().uuid().optional().nullable(),
  procedure_id: z.string().uuid().optional().nullable(),
  status: slotStatusEnum.default("available"),
  channel: channelEnum.optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const MessageSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  conversation_id: z.string().uuid().optional().nullable(),
  channel: channelEnum,
  direction: messageDirectionEnum,
  type: messageTypeEnum,
  content: z.string().max(4000).optional().nullable(),
  audio_url: z.string().url().optional().nullable(),
  transcript: z.string().max(4000).optional().nullable(),
  created_at: z.string().datetime().optional(),
});

export const ConversationSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  channel: channelEnum,
  status: conversationStatusEnum.default("active"),
  ai_context: z.record(z.string(), z.unknown()).optional().nullable(),
  last_message_at: z.string().datetime().optional(),
});

export const StaffSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(100).trim(),
  role: z.enum(["admin", "staff"]),
  email: z.string().trim().email().max(255).toLowerCase(),
  is_active: z.boolean().default(true),
});

export const StaffNotificationSchema = z.object({
  id: z.string().uuid().optional(),
  staff_id: z.string().uuid(),
  type: notificationTypeEnum,
  payload: z.record(z.string(), z.unknown()).default({}),
  is_read: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
});

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// WorkingHours: day-keyed object matching DB structure { "mon": ["08:00","18:00"], ... }
export const WorkingHoursSchema = z.record(
  z.string(),
  z.tuple([z.string().regex(timeRegex), z.string().regex(timeRegex)]).nullable()
);

export const FaqItemSchema = z.object({
  q: z.string().min(1).max(500),
  a: z.string().min(1).max(2000),
});

export const AgentConfigSchema = z.object({
  id: z.string().uuid().optional(),
  system_prompt: z.string().min(1).max(8000),
  working_hours: WorkingHoursSchema,
  faq: z.array(FaqItemSchema).default([]),
  enabled_channels: z.array(channelEnum).default(["whatsapp", "web"]),
  updated_at: z.string().datetime().optional(),
});

export const MessageTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  type: templateTypeEnum,
  content: z.string().min(1).max(4000),
  channel: channelEnum.optional().nullable(),
  is_active: z.boolean().default(true),
});

export const ChatStatusSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  ia_activa: z.boolean().default(true),
  last_updated: z.string().datetime().optional().nullable(),
});
