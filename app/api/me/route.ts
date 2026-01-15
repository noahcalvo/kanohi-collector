import { NextResponse } from "next/server";
import { getUserIdOrThrow } from "../../../lib/auth";
import { mePayload } from "../../../lib/engine";

export async function GET() {
  try {
    const userId = await getUserIdOrThrow();
    const payload = await mePayload(userId);
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
