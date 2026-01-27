import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Behavior:
 * - If there's no Clerk session cookie and no guest cookie, redirect to /tutorial for:
 *   - Document requests (accept: text/html)
 *   - Next.js client-side navigations (/_next/data, x-nextjs-data, or accept: application/json)
 * - For API routes, return a 401 JSON response.
 * - Always allow /tutorial and the create-account endpoint (/api/me) to pass through.
 */

const isCreateAccountRoute = createRouteMatcher(["/api/me(.*)"]);
const isTutorialRoute = createRouteMatcher(["/tutorial(.*)"]);
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isTutorialApiRoute = createRouteMatcher(["/api/tutorial(.*)"]);

export default clerkMiddleware(async (_auth, req: NextRequest) => {
  // Allow tutorial and account-creation endpoints (avoid redirect loops / onboarding flow).
  if (
    isTutorialRoute(req) ||
    isTutorialApiRoute(req) ||
    isCreateAccountRoute(req) ||
    isAuthRoute(req)
  ) {
    return NextResponse.next();
  }

  const cookieHeader = req.headers.get("cookie") ?? "";
  const hasGuestCookie = cookieHeader.includes("kanohi_guest_id=");
  const hasClerkCookie = cookieHeader.includes("__session=");

  // If neither guest nor clerk session present, enforce redirect to /tutorial
  if (!hasGuestCookie && !hasClerkCookie) {
    const pathname = req.nextUrl.pathname;

    // API routes -> JSON 401 (don't redirect fetches)
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const accept = (req.headers.get("accept") ?? "").toLowerCase();

    // Document navigations (full page loads)
    const isDocumentRequest = accept.includes("text/html");

    const isClientSideNavigation =
      req.headers.get("next-url") ||
      (req.headers.get("referer") ?? req.headers.get("referrer"));

    if (isDocumentRequest || isClientSideNavigation) {
      return NextResponse.redirect(new URL("/tutorial", req.url));
    }

    // conservative fallback
    return NextResponse.next();
  }

  // has guest or clerk session -> proceed
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/api/(.*)"],
};
