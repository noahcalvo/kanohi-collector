import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  "/collection(.*)",
  "/friends(.*)",
  "/shop(.*)",
  "/settings(.*)",
  "/tutorial(.*)",
]);

const isCreateAccountRoute = createRouteMatcher(["/api/me(.*)"]);

const isTutorialRoute = createRouteMatcher(["/tutorial(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const hasClerkKeys =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

  if (!hasClerkKeys || isTutorialRoute(req) || isCreateAccountRoute(req)) {
    return NextResponse.next();
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const hasGuestCookie = cookieHeader.includes("kanohi_guest_id=");
  const hasClerkCookie = cookieHeader.includes("__session=");
  console.log(
    "Middleware - hasGuestCookie:",
    hasGuestCookie,
    "hasClerkCookie:",
    hasClerkCookie,
  );

  if (!hasGuestCookie && !hasClerkCookie) {
    const pathname = req.nextUrl.pathname;

    // If this is an API request, don't "redirect the fetch"
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Only redirect actual page navigations (document requests)
    const accept = req.headers.get("accept") || "";
    const isDocument = accept.includes("text/html");

    if (isDocument) {
      return NextResponse.redirect(new URL("/tutorial", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/api/(.*)"],
};
