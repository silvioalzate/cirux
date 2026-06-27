import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { timingSafeEqual } from "crypto";

const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

const EvolutionPayloadSchema = z.object({
  event: z.literal("messages.upsert"),
  instance: z.string().optional(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string().optional(),
    }),
    message: z.object({
      conversation: z.string().optional(),
      extendedTextMessage: z.object({ text: z.string() }).optional(),
    }),
    messageType: z.string().optional(),
    pushName: z.string().optional(),
  }).optional(),
});

export async function POST(request: Request) {
  // Auth is mandatory. Reject if API key env var is missing or header doesn't match.
  if (!EVOLUTION_API_KEY) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("apikey") ?? request.headers.get("x-api-key") ?? "";
  // Constant-time comparison to mitigate timing attacks
  const keyMatches =
    authHeader.length === EVOLUTION_API_KEY.length &&
    timingSafeEqual(Buffer.from(authHeader), Buffer.from(EVOLUTION_API_KEY));
  if (!keyMatches) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const raw = await request.json();
    const parsed = EvolutionPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ status: "ignored", reason: "invalid payload format" });
    }

    const { data: body } = parsed;
    const key = body.data?.key;
    const message = body.data?.message;

    if (!key || !message) {
      return NextResponse.json({ status: "ignored", reason: "no key or message" });
    }

    if (key.fromMe) {
      return NextResponse.json({ status: "ignored", reason: "fromMe" });
    }

    if (key.remoteJid.includes("@g.us")) {
      return NextResponse.json({ status: "ignored", reason: "group message" });
    }

    const text =
      message.conversation ??
      message.extendedTextMessage?.text ??
      "";
    if (!text) {
      return NextResponse.json({ status: "ignored", reason: "no text content" });
    }

    const phone = key.remoteJid.replace(/@.*$/, "");

    // 1. Find or create patient
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id, name")
      .eq("phone", phone)
      .maybeSingle();

    let patientId: string;
    let patientName: string;

    if (existingPatient) {
      patientId = existingPatient.id;
      patientName = existingPatient.name;
    } else {
      const { data: newPatient, error: createPatientError } = await supabase
        .from("patients")
        .insert({
          phone,
          name: body.data?.pushName?.trim().slice(0, 120) || `Paciente ${phone}`,
          status: "prospecto",
        })
        .select("id, name")
        .single();

      if (createPatientError || !newPatient) {
        console.error("Error creating patient:", createPatientError?.message ?? "unknown");
        return NextResponse.json({ error: "failed to create patient" }, { status: 500 });
      }

      patientId = newPatient.id;
      patientName = newPatient.name;
    }

    // 2. Find or create conversation
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("patient_id", patientId)
      .eq("channel", "whatsapp")
      .maybeSingle();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const { data: newConv, error: createConvError } = await supabase
        .from("conversations")
        .insert({
          patient_id: patientId,
          channel: "whatsapp",
          status: "pending_human",
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createConvError || !newConv) {
        console.error("Error creating conversation:", createConvError);
        return NextResponse.json({ error: "failed to create conversation" }, { status: 500 });
      }

      conversationId = newConv.id;
    }

    // 3. Insert incoming message
    const { error: msgError } = await supabase.from("messages").insert({
      patient_id: patientId,
      conversation_id: conversationId,
      channel: "whatsapp",
      direction: "in",
      type: "text",
      content: text.trim().slice(0, 4000),
      transcript: text.trim().slice(0, 4000),
    });

    if (msgError) {
      console.error("Error inserting message:", msgError?.message ?? "unknown");
      return NextResponse.json({ error: "failed to save message" }, { status: 500 });
    }

    // 4. Update conversation
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        status: "pending_human",
      })
      .eq("id", conversationId);

    console.log(`[Evolution Webhook] Message saved`);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Evolution webhook error:", (error as Error).message);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
