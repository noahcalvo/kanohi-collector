import { NextResponse } from "next/server";
import { getUserId, setGuestCookie } from "../../../lib/auth";
import { mePayload } from "../../../lib/engine";

const GET = async () => {
  try {
    console.log("Handling GET /api/me");
    const { userId, isGuest } = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "No userId found in GET /api/me" },
        { status: 400 },
      );
    }
    const payload = await mePayload(isGuest, userId);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("Error in GET /api/me:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};

const POST = async (req: Request) => {
  // Only create a guest user if explicitly requested
  const url = new URL(req.url);
  const guest = url.searchParams.get("guest");
  if (!guest) {
    return NextResponse.json(
      { error: "Guest creation not requested" },
      { status: 400 },
    );
  }
  try {
    // Always create a new guest user and set cookie
    const { createNewGuestId } = await import("../../../lib/guestUser");
    const { prismaStore } = await import("../../../lib/store/prismaStore");
    const userId = createNewGuestId();
    await prismaStore.getOrCreateUser(true, userId);
    setGuestCookie(userId);
    const payload = await mePayload(true, userId);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("Error in POST /api/me:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};

export { GET, POST };