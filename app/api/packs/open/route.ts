import { NextResponse } from "next/server";
import { openPack } from "../../../../lib/engine";
import { z } from "zod";

const schema = z.object({ pack_id: z.string(), client_request_id: z.string().uuid() });
const USER_ID = "user-1";
const IDEMPOTENCY_TTL_MS = 60_000;
const recent = new Map<string, { result: unknown; expires: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const now = Date.now();
    const cached = recent.get(parsed.client_request_id);
    if (cached && cached.expires > now) {
      return NextResponse.json(cached.result);
    }
    if (parsed.pack_id !== "free_daily_v1") {
      return NextResponse.json({ error: "Unknown pack" }, { status: 400 });
    }
    const result = openPack(USER_ID, parsed.pack_id);
    recent.set(parsed.client_request_id, { result, expires: now + IDEMPOTENCY_TTL_MS });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
