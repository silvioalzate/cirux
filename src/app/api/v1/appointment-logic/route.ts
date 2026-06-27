import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const RequestSchema = z.object({
  query: z.string().min(1).max(200),
  patient_id: z.string().uuid().optional(),
  target_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});

export async function POST(request: Request) {
  // Authentication check
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = RequestSchema.parse(body);

    const supabase = await createClient();

    // Query available slots for the target date directly from the slots table
    const startOfDay = `${data.target_date}T00:00:00Z`;
    const endOfDay = `${data.target_date}T23:59:59Z`;

    const { data: availability, error } = await supabase
      .from("slots")
      .select("*")
      .gte("start_at", startOfDay)
      .lte("end_at", endOfDay)
      .eq("is_available", true)
      .is("block_type", null)
      .order("start_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Supabase query error:", error.message);
      return NextResponse.json(
        { error: "No se pudo comprobar la disponibilidad." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Procesado correctamente por AI agent",
        available_slots: availability || [],
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos de entrada inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
