import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { createNewGuestId } from "./guestUser";
import { log } from "./logger";

export async function getUserIdOrThrow(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

// Returns userId if authenticated, otherwise returns a guest id (from cookie or generates one)
export const GUEST_COOKIE = "kanohi_guest_id";

export async function getOrCreateUserId(): Promise<{
  isGuest: boolean;
  userId: string;
  setCookie: boolean;
}> {
  let setCookie = false;
  const { userId } = await auth();
  if (userId) return { userId, isGuest: false, setCookie };
  // Try to get guest id from cookie
  let guestId = cookies().get(GUEST_COOKIE)?.value;
  log.debug("[auth] guestId from cookie", Boolean(guestId));
  if (!guestId) {
    setCookie = true;
    guestId = createNewGuestId();
  }
  return { userId: guestId, isGuest: true, setCookie };
}

export async function getUserId(): Promise<{
  userId: string | null;
  isGuest: boolean;
}> {
  const { userId } = await auth();
  if (userId) return { userId, isGuest: false };
  // Try to get guest id from cookie
  const guestId = cookies().get(GUEST_COOKIE)?.value;
  log.debug("[auth] guestId from cookie", Boolean(guestId));
  if (guestId) {
    return { userId: guestId, isGuest: true };
  }
  return { userId: null, isGuest: false };
}

// Helper to set guest cookie in a Server Action or Route Handler
export function setGuestCookie(guestId: string) {
  cookies().set(GUEST_COOKIE, guestId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
}
