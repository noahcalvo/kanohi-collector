import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "../../../../../lib/auth";
import { setMaskColor } from "../../../../../lib/engine";

const schema = z.object({ color: z.string() });

export async function POST(
  request: Request,
  { params }: { params: { mask_id: string } }
) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const { userId, isGuest } = await getUserId();
    if (!userId) {
      throw new Error("No userId found in set mask color");
    }
    const updated = await setMaskColor(
      isGuest,
      userId,
      params.mask_id,
      parsed.color,
    );
    return NextResponse.json({
      mask_id: updated.mask_id,
      equipped_color: updated.equipped_color,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
