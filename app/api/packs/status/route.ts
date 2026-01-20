import { NextResponse } from "next/server";
import { getUserId } from "../../../../lib/auth";
import { packStatus } from "../../../../lib/engine";

export async function GET() {
  try {
    const { userId, isGuest } = await getUserId();
    if (!userId) {
      throw new Error("No userId found in pack status");
    }
    const status = await packStatus(isGuest, userId, "free_daily_v1");
    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
