import { NextResponse } from "next/server";

/**
 * Health check endpoint for Docker and load balancers.
 * Returns 200 if the app is running.
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
