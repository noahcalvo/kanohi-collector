import { NextResponse } from "next/server";
import { packStatus } from "../../../../lib/engine";
import { getUserIdOrThrow } from "../../../../lib/auth";

export async function GET() {
  try {
    const userId = getUserIdOrThrow();
    const status = await packStatus(userId, "free_daily_v1");
    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
