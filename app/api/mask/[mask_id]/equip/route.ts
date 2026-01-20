import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "../../../../../lib/auth";
import { equipMask } from "../../../../../lib/engine";

const schema = z.object({ slot: z.enum(["TOA", "TURAGA", "NONE"]) });

export async function POST(
  request: Request,
  { params }: { params: { mask_id: string } }
) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const { userId, isGuest } = await getUserId();
    if (!userId) {
      throw new Error("No userId found in equip mask");
    }
    const updated = await equipMask(
      isGuest,
      userId,
      params.mask_id,
      parsed.slot,
    );
    return NextResponse.json({
      mask_id: updated.mask_id,
      slot: updated.equipped_slot,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
