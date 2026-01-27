import { NextResponse } from "next/server";
import { getOrCreateUserId, setGuestCookie } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createPrismaStore } from "@/lib/store/prismaStore";
import { TUTORIAL_KEY } from "@/lib/tutorial/constants";
import {
  computeTutorialStateForResponse,
  tutorialKeySchema,
  upsertTutorialProgress,
} from "@/lib/tutorial/server";
import { STARTER_MASK_IDS } from "@/lib/tutorial/starterMasks";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tutorialKey = tutorialKeySchema.parse(
      url.searchParams.get("tutorialKey") ?? TUTORIAL_KEY,
    );

    const actor = await getOrCreateUserId();
    if (actor.setCookie) setGuestCookie(actor.userId);

    const result = await prisma.$transaction(async (tx) => {
      const store = createPrismaStore(tx);
      const user = await store.getOrCreateUser(actor.isGuest, actor.userId);
      const progress = await upsertTutorialProgress(tx, {
        userId: user.id,
        tutorialKey,
      });

      return {
        user_id: user.id,
        is_guest: actor.isGuest,
        ...computeTutorialStateForResponse(progress, actor.isGuest),
      };
    });

    return NextResponse.json({
      ...result,
      starter_mask_ids: STARTER_MASK_IDS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
