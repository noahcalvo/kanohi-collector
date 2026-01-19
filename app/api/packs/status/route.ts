import { NextResponse } from "next/server";
import { getUserIdAllowGuest } from "../../../../lib/auth";
import { packStatus } from "../../../../lib/engine";

export async function GET() {
  try {
    const { userId } = await getUserIdAllowGuest();
    const status = await packStatus(userId, "free_daily_v1");
    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
