import { NextResponse } from "next/server";
import { equipMask } from "../../../../../lib/engine";
import { z } from "zod";

const schema = z.object({ slot: z.enum(["TOA", "TURAGA", "NONE"]) });
const USER_ID = "user-1";

export async function POST(request: Request, { params }: { params: { mask_id: string } }) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const updated = equipMask(USER_ID, params.mask_id, parsed.slot);
    return NextResponse.json({ mask_id: updated.mask_id, slot: updated.equipped_slot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
