import { NextResponse } from "next/server";
import { mePayload } from "../../../lib/engine";

const USER_ID = "user-1";

export async function GET() {
  try {
    const payload = mePayload(USER_ID);
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
