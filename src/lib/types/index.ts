/**
 * Tipos globales del dominio EnFlow.
 * Refleja el modelo de datos definido en el SRS §5.3 y las columnas reales de la DB.
 */

// ─── Enums ─────────────────────────────────────────────────────────────────

export type PatientStatus = "prospecto" | "activo" | "inactivo";
export type SlotStatus = "available" | "confirmed" | "cancelled" | "completed" | "reschedule" | "blocked";
export type BlockType = "surgery" | "admin" | "vacation" | "event" | "appointment";
export type SlotChannel = "whatsapp" | "messenger" | "instagram" | "tiktok" | "web" | "manual";
export type MessageDirection = "in" | "out";
export type MessageType = "text" | "audio" | "image" | "document";
export type ConversationStatus = "active" | "pending_human" | "resolved";
export type StaffRole = "admin" | "staff";
export type Channel = "whatsapp" | "messenger" | "instagram" | "tiktok" | "web" | "manual";
export type TemplateType =
  | "confirmation"
  | "reminder"
  | "reschedule"
  | "post_op"
  | "notification"
  | "news"
  | "surgeon_instructions";
export type NotificationType =
  | "new_appointment"
  | "appointment_cancelled"
  | "human_handoff"
  | "new_patient"
  | "appointment_reminder_2h"
  | "daily_summary"
  | "appointment_rescheduled"
  | "appointment_reminder_next_day";

// ─── Entidades ──────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  status: PatientStatus;
  created_at: string;
  updated_at: string;
  patient_profile?: PatientProfile;
}

export interface PatientProfile {
  id: string;
  patient_id: string;
  interested_procedures: string[];
  notes: string | null;
  last_interaction: string | null;
  created_at: string;
  updated_at: string;
}

export interface Procedure {
  id: string;
  name: string;
  description: string | null;
  duration_min: number;
  preparation_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Slot {
  id: string;
  start_at: string;
  end_at: string;
  block_type: BlockType;
  patient_id: string | null;
  procedure_id: string | null;
  status: SlotStatus;
  channel: SlotChannel | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  procedure?: Procedure;
}

/** @deprecated Use Slot instead. Kept for backward compat in calendar/appointment views. */
export type Appointment = Slot;

export interface Message {
  id: string;
  patient_id: string;
  conversation_id: string | null;
  channel: Channel;
  direction: MessageDirection;
  type: MessageType;
  content: string | null;
  audio_url: string | null;
  transcript: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  patient_id: string;
  channel: Channel;
  status: ConversationStatus;
  ai_context: Record<string, unknown> | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  messages?: Message[];
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffNotification {
  id: string;
  staff_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface AgentConfig {
  id: string;
  system_prompt: string;
  working_hours: WorkingHours;
  faq: FaqItem[];
  enabled_channels: Channel[];
  updated_at: string;
}

// WorkingHours: day-keyed dictionary matching DB JSONB structure
// e.g. { "mon": ["08:00","18:00"], "tue": ["09:00","17:00"], "sun": null }
export type WorkingHours = Record<string, [string, string] | null>;

// FaqItem uses "q"/"a" keys matching DB JSONB structure
export interface FaqItem {
  q: string;
  a: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: TemplateType;
  content: string;
  channel: Channel;
  is_active: boolean;
}
