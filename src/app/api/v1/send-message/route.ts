import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

const phoneRegex = /^[+]?[\d\s\-().]{7,30}$/;

const SendSchema = z.object({
  number: z.string().regex(phoneRegex, "Invalid phone format").max(30),
  text: z.string().min(1).max(4000),
  patientId: z.string().uuid(),
  conversationId: z.string().uuid(),
  quotedMessage: z.string().max(4000).optional(),
});

export async function POST(request: Request) {
  if (!EVOLUTION_URL || !EVOLUTION_API_KEY) {
    return NextResponse.json({ error: "Service configuration missing" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = SendSchema.parse(body);

    // 1. Send via Evolution API
    const evoRes = await fetch(EVOLUTION_URL!, {
      method: "POST",
      headers: {
        apikey: EVOLUTION_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: data.number.trim(),
        text: data.text.trim(),
        delay: 100,
        linkPreview: true,
        ...(data.quotedMessage && {
          quoted: {
            key: { id: data.conversationId },
            message: { conversation: data.quotedMessage.trim() },
          },
        }),
      }),
    });

    const evoData = await evoRes.json();

    if (!evoRes.ok) {
      console.error("Evolution API error:", evoRes.status);
      return NextResponse.json(
        { error: "Error al enviar el mensaje por WhatsApp" },
        { status: 502 }
      );
    }

    // 2. Save outgoing message to database
    const { error: dbError } = await supabase.from("messages").insert({
      patient_id: data.patientId,
      conversation_id: data.conversationId,
      channel: "whatsapp",
      direction: "out",
      type: "text",
      content: data.text.trim(),
    });

    if (dbError) {
      console.error("DB insert error:", dbError?.message ?? "unknown");
    }

    // 3. Update conversation last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", data.conversationId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }
    console.error("Send message error:", (error as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
