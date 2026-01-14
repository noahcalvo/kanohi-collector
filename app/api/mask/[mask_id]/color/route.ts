import { NextResponse } from "next/server";
import { setMaskColor } from "../../../../../lib/engine";
import { z } from "zod";

const schema = z.object({ color: z.string() });
const USER_ID = "user-1";

export async function POST(request: Request, { params }: { params: { mask_id: string } }) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const updated = setMaskColor(USER_ID, params.mask_id, parsed.color);
    return NextResponse.json({ mask_id: updated.mask_id, equipped_color: updated.equipped_color });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
