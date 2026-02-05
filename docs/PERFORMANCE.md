# Performance Optimization Guide

## Image Optimization

### GIF Compression (Manual Step)
The project currently has 25MB of GIF files in `public/gifs/`. These should be optimized:

```bash
# Install gifsicle for GIF optimization
brew install gifsicle  # macOS
# or
sudo apt-get install gifsicle  # Linux

# Optimize GIFs (run from project root)
cd public/gifs
for file in *.gif; do
  gifsicle -O3 --colors 256 "$file" -o "optimized-$file"
  mv "optimized-$file" "$file"
done
```

**Expected savings:** 25MB → ~8-10MB (60-70% reduction)

Alternative: Use online tools like:
- https://ezgif.com/optimize
- https://www.iloveimg.com/compress-image/compress-gif

### PNG Optimization
Optimize mask PNGs for smaller file sizes:

```bash
# Install pngquant
brew install pngquant  # macOS

# Optimize all mask images
cd public/masks
pngquant --quality=80-95 --ext .png --force *.png
```

## Performance Optimizations Applied

### 1. **Next.js Configuration**
- ✅ Enabled gzip compression
- ✅ Configured WebP/AVIF image formats
- ✅ Optimized webpack bundle splitting
- ✅ Removed console logs in production
- ✅ Separated Clerk auth into own chunk

### 2. **Code Splitting**
- ✅ Lazy loaded `PackOpeningModal` (only loads when opening packs)
- ✅ Dynamic imports for heavy components
- ✅ Reduced initial bundle size

### 3. **React Optimizations**
- ✅ Memoized `ColoredMask` component
- ✅ Memoized `EmptySlotCard` component
- ✅ Used `useCallback` for event handlers
- ✅ Prevented unnecessary re-renders

### 4. **Data Fetching**
- ✅ Parallelized server-side data fetching with `Promise.all()`
- ✅ Added revalidation strategy (60s cache)
- ✅ Server Components for initial data load

### 5. **Image Loading**
- ✅ Added lazy loading for non-critical images
- ✅ Added `priority` prop for above-the-fold images
- ✅ Configured responsive image sizes
- ✅ Set long cache TTL for static assets (1 year)

### 6. **Font Optimization**
- ✅ Added `font-display: swap` to prevent FOIT (Flash of Invisible Text)
- ✅ Configured font preloading
- ✅ Added fallback fonts

## Performance Metrics

### Before Optimization
- First Load JS: ~87KB shared
- Largest route: /tutorial (162KB)
- No code splitting
- Sequential data fetching

### After Optimization
- ✅ Reduced initial bundle (PackOpeningModal lazy loaded)
- ✅ Faster data fetching (parallel queries)
- ✅ Better caching strategy
- ✅ Optimized re-renders with memoization

## Monitoring Performance

### Lighthouse Audit
```bash
# Run Lighthouse in production mode
yarn build
yarn start
# Then run Lighthouse in Chrome DevTools
```

### Web Vitals
The app uses `@vercel/analytics` which automatically tracks:
- **LCP** (Largest Contentful Paint) - Target: <2.5s
- **FID** (First Input Delay) - Target: <100ms
- **CLS** (Cumulative Layout Shift) - Target: <0.1

### Bundle Analysis
```bash
# Add to package.json scripts:
"analyze": "ANALYZE=true next build"

# Install analyzer
yarn add -D @next/bundle-analyzer

# Run analysis
yarn analyze
```

## Further Optimizations (Optional)

### 1. Service Worker for Offline Support
```bash
yarn add next-pwa
```

### 2. Database Query Optimization
- Add database indexes for frequently queried fields
- Use connection pooling
- Consider Redis for session caching

### 3. CDN for Static Assets
- Upload mask images to CDN
- Use CDN for GIFs
- Reduces server load

### 4. Progressive Web App (PWA)
- Add service worker
- Enable offline support
- Add app manifest (already configured)

## Best Practices Checklist

- ✅ Images use Next.js Image component
- ✅ Components are memoized where appropriate
- ✅ Event handlers use `useCallback`
- ✅ Data fetching is parallelized
- ✅ Code splitting for large components
- ✅ Fonts optimized with `font-display: swap`
- ✅ Production console logs removed
- ✅ Webpack bundle optimized
- ⏳ GIFs need manual compression
- ⏳ PNGs could be further optimized
