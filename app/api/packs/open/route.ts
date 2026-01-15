import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserIdOrThrow } from "../../../../lib/auth";
import { openPack } from "../../../../lib/engine";

const schema = z.object({
  pack_id: z.string(),
  client_request_id: z.string().uuid(),
});
const IDEMPOTENCY_TTL_MS = 60_000;
const recent = new Map<string, { result: unknown; expires: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[packs/open] Request body:", body);
    const parsed = schema.parse(body);
    const userId = await getUserIdOrThrow();
    const now = Date.now();
    const cacheKey = `${userId}:${parsed.client_request_id}`;
    const cached = recent.get(cacheKey);
    if (cached && cached.expires > now) {
      return NextResponse.json(cached.result);
    }
    if (parsed.pack_id !== "free_daily_v1") {
      return NextResponse.json({ error: "Unknown pack" }, { status: 400 });
    }
    const result = await openPack(userId, parsed.pack_id);
    recent.set(cacheKey, {
      result,
      expires: now + IDEMPOTENCY_TTL_MS,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[packs/open] Error:", message, err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
