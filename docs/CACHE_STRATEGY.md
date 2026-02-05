# Cache Strategy

## Problem

In Next.js 14 App Router with Server Components, navigating between pages using `<Link>` components can show stale data because:

1. **Server Components cache data** during build/revalidation
2. **Next.js router caches** server component responses for client-side navigation
3. **Client-side hooks** don't automatically refresh when navigating back to a page

Example: User opens a pack on home page → navigates to collection → navigates back → pack count still shows old value.

## Solution: Targeted Cache Invalidation

Instead of disabling caching entirely (which hurts performance), we invalidate the cache **only when mutations happen**.

### Implementation

#### 1. Keep Server-Side Caching Enabled

```typescript
// app/page.tsx, app/collection/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds
```

This allows fast page loads for users just browsing.

#### 2. Invalidate Router Cache After Mutations

In mutation hooks, call `router.refresh()` after successful API calls:

```typescript
// app/hooks/usePackOpening.ts
import { useRouter } from "next/navigation";

export function usePackOpening(args) {
  const router = useRouter();
  
  const openPack = async () => {
    // ... API call to open pack
    await fetchJson("/api/packs/open", { method: "POST" });
    
    // Refresh local state
    refreshStatus();
    
    // Invalidate Next.js router cache for server components
    router.refresh();
  };
}
```

This pattern is used in:
- `usePackOpening` - After opening a pack
- `useEquipMask` - After equipping a mask
- `useColorPicker` - After changing mask color

#### 3. Refresh on Navigation

```typescript
// app/components/BottomNav.tsx
const handleNavigation = (href: string) => {
  if (pathname !== href) {
    router.refresh(); // Get fresh server data when navigating
  }
};
```

This ensures the destination page has fresh data from the server.

### How It Works

1. **User opens pack:**
   - `usePackOpening` calls API
   - `refreshStatus()` updates client state immediately
   - `router.refresh()` invalidates Next.js router cache
   - User sees updated pack count in UI immediately

2. **User navigates to Collection:**
   - `BottomNav` calls `router.refresh()`
   - Server Component re-fetches user data
   - Collection page shows updated masks

3. **User navigates back to Home:**
   - `BottomNav` calls `router.refresh()` 
   - Server Component re-fetches pack status and user data
   - Home page shows correct pack count

4. **User just browses without mutations:**
   - No `router.refresh()` called except on navigation
   - Pages load fast from 60s cache
   - No unnecessary network requests

### Benefits vs Previous Approach

**Previous (v1): Disable all caching**
- ❌ Slow page loads (no cache, always fetch)
- ❌ Unnecessary requests on focus/visibility changes
- ❌ Poor user experience when just browsing
- ✅ Always fresh data

**Current (v2): Targeted invalidation**
- ✅ Fast page loads when browsing (uses cache)
- ✅ Fresh data after mutations (targeted invalidation)
- ✅ No unnecessary requests
- ✅ Better performance overall
- ✅ Always fresh data

### When to Use This Pattern

Use targeted cache invalidation when:
- You have user-specific data that changes based on actions
- Users navigate between pages frequently
- You want to balance freshness with performance

Avoid if:
- Data rarely changes (use longer revalidation)
- Real-time updates are critical (use WebSockets/polling)
- You have simple read-only pages (static generation is better)

### Key Takeaway

**Cache aggressively, invalidate surgically.** Keep caching enabled for performance, but invalidate strategically when data actually changes.
