import { NextResponse } from "next/server";
import { mePayload } from "../../../lib/engine";
import { getUserIdOrThrow } from "../../../lib/auth";

export async function GET() {
  try {
    const userId = getUserIdOrThrow();
    const payload = await mePayload(userId);
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
