# Vercel 250MB Function Size Optimization Guide

## Current Status ✅

Your project is **well-optimized** and currently **well under** Vercel's 250MB serverless function limit:

- **Total Server Bundle**: 24.97 MB (well under 250MB limit)
- **API Routes**:
  - `/api/price`: 5.34 KB
  - `/api/snapshot`: 3.19 MB
- **Static Assets**: 2.54 MB

## Optimizations Implemented

### 1. **Webpack Externals Configuration** ✅

- Externalized heavy blockchain SDKs (`@saros-finance/dlmm-sdk`, `@solana/spl-token`)
- Excluded development tools and large utility libraries
- Properly configured for both server and client bundles

### 2. **Dynamic Imports** ✅

- API routes use dynamic imports to avoid bundling heavy dependencies
- Supabase client now uses lazy loading to reduce initial bundle size

### 3. **File Tracing Optimization** ✅

- Added `outputFileTracingIncludes` and `outputFileTracingExcludes` in `next.config.ts`
- Excludes unnecessary files from serverless functions (components, hooks, types, etc.)

### 4. **Vercel Configuration** ✅

- Created `vercel.json` to exclude unnecessary files from serverless functions
- Configured proper file exclusions for API routes

### 5. **Bundle Size Monitoring** ✅

- Added `npm run build:size-check` script for continuous monitoring
- Automated bundle size checking with 200MB safety margin
- Warns when approaching size limits

### 6. **Code Splitting** ✅

- Comprehensive chunk splitting with 200KB per chunk limit
- Separate chunks for different libraries (Solana, Supabase, React, etc.)
- Optimized for tree-shaking

## Best Practices Followed

### ✅ **Dependency Management**

- Minimal dependencies (only essential packages)
- Proper externalization of heavy libraries
- No duplicate dependencies

### ✅ **Static Asset Handling**

- Static files served via CDN (not bundled in functions)
- Proper image optimization configuration
- Compressed assets

### ✅ **Code Structure**

- Modular API routes with single responsibilities
- Dynamic imports for heavy dependencies
- Lazy loading of database clients

### ✅ **Build Optimization**

- Tree-shaking enabled
- Dead code elimination
- Optimized package imports

## Monitoring & Maintenance

### Regular Checks

```bash
# Check bundle sizes
npm run build:size-check

# Analyze bundle composition
npm run build:analyze
```

### Size Monitoring

- **Current**: 24.97 MB (10% of limit)
- **Warning Threshold**: 150 MB (60% of limit)
- **Hard Limit**: 250 MB (100% of limit)

### What to Watch For

1. **New Dependencies**: Check size impact before adding
2. **Bundle Growth**: Monitor size increases over time
3. **API Route Changes**: Ensure new routes stay optimized

## Future Recommendations

### If Approaching Limits

1. **Split Large Functions**: Break down complex API routes
2. **External Services**: Move heavy processing to separate services
3. **Further Optimization**: Remove unused code and dependencies
4. **Caching**: Implement aggressive caching strategies

### Continuous Optimization

1. **Regular Audits**: Monthly dependency reviews
2. **Bundle Analysis**: Quarterly bundle composition analysis
3. **Performance Monitoring**: Track function cold start times
4. **Code Reviews**: Include bundle size impact in PR reviews

## Key Files Modified

- `next.config.ts` - Webpack externals and file tracing
- `vercel.json` - Vercel-specific optimizations
- `package.json` - Added size monitoring script
- `scripts/check-bundle-size.js` - Bundle size monitoring tool
- `src/lib/data/supabaseClient.ts` - Lazy loading implementation

## References

- [Vercel 250MB Function Limit Guide](https://vercel.com/guides/troubleshooting-function-250mb-limit)
- [Next.js Bundle Optimization](https://nextjs.org/docs/advanced-features/webpack)
- [Vercel Configuration](https://vercel.com/docs/project-configuration)

---

**Status**: ✅ **OPTIMIZED** - Your project is well within Vercel's limits and follows best practices for serverless function optimization.
