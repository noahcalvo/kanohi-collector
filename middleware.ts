import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/", // Home page
  "/collection(.*)",
  "/friends(.*)",
  "/shop(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip auth check if Clerk keys are not configured
  const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                       !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder');
  // Only protect routes that truly require authentication
  if (!hasClerkKeys || isPublicRoute(req)) return;
  // For now, allow guest access everywhere except sign-in/sign-up
  // Remove or adjust this logic if you want to restrict more routes
  // await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/api/(.*)",
  ],
};
