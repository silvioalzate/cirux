import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API route to fetch pending conversations server-side.
 * This prevents sensitive table names from being exposed in the client bundle.
 */
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*, patient:patients(id, name, phone)")
    .eq("status", "pending_human")
    .order("last_message_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending conversations:", error.message);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }

  return NextResponse.json({ conversations: data ?? [] });
}
