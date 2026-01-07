import { NextResponse } from "next/server";
import { packStatus } from "../../../../lib/engine";

const USER_ID = "user-1";

export async function GET() {
  try {
    const status = packStatus(USER_ID, "free_daily_v1");
    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
