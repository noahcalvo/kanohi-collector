import { NextResponse } from "next/server";
import { getUserIdAllowGuest, setGuestCookie } from "../../../lib/auth";
import { mePayload } from "../../../lib/engine";

const GET = async () => {
  try {
    const { userId, isGuest, setCookie } = await getUserIdAllowGuest();
    // If guest, ensure user exists in DB
    if (isGuest) {
      // Create user in DB if not exists
      const { prismaStore } = await import("../../../lib/store/prismaStore");
      await prismaStore.getOrCreateUser(isGuest, userId);
      // Set cookie if needed
      if (setCookie) setGuestCookie(userId);
    }
    const payload = await mePayload(isGuest, userId);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("Fuuuuuuckkkk in GET /api/me:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};

export { GET };