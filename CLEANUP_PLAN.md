# Project Cleanup Plan

## Files to Keep (Essential)

### Core Application Files
- `package.json` - Dependencies
- `package-lock.json` - Lock file
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Tailwind CSS config
- `tsconfig.json` - TypeScript config
- `eslint.config.js` - ESLint config
- `postcss.config.js` - PostCSS config
- `components.json` - Shadcn UI config
- `.gitignore` - Git ignore rules
- `index.html` - Main HTML file
- `README.md` - Project documentation

### Source Code
- `src/` directory (all files)
- `backend/` directory (all files)
- `public/` directory (all files)
- `.github/workflows/` (deployment)

### Documentation (Keep only latest)
- `README.md` - Keep (main docs)
- `SYSTEM_STATUS_FINAL.md` - Keep (final status)
- `test-backend.html` - Keep (automated testing)
- `test-api.sh` - Keep (API testing)
- `SYSTEM_TEST_GUIDE_EC2.md` - Keep (testing guide)
- `PERFORMANCE_TEST.md` - Keep (performance guide)

### Images
- `herbexint.png` - Keep (logo)
- `public/herbexint.png` - Keep

## Files to Remove (Unnecessary/Temporary)

### Status/Debug Files (32 files)
- `DEPLOYMENT_ISSUE_DIAGNOSIS.md`
- `DEPLOYMENT_STATUS.md`
- `HERB_EC2_DEPLOYMENT.md`
- `TESTING_SYSTEM_SUMMARY.md`
- `CUSTOMER_CREATION_FIX.md`
- `ROUTES_FIX_SUMMARY.md`
- `CATALOG_FIX_SUMMARY.md`
- `ALL_ISSUES_FIXED.md`
- `FINAL_VERIFICATION.md`
- `PHARMA_VERIFICATION.md`
- `DEPLOYMENT_VERIFICATION.md`
- `FINAL_FIX_SUMMARY.md`
- `SCAN_RESULTS.md`
- `SYSTEM_STATUS.md`
- `HOW_TO_TEST.md`
- `BACKEND_EC2_SETUP.md`
- `FIX_SUMMARY.md`
- `TROUBLESHOOTING.md`
- `DEPLOYMENT_COMPLETE.md`
- `BACKEND_MIGRATION_SUMMARY.md`
- `BACKEND_ON_EC2.md`
- `FINAL_STATUS.md`
- `AWS_BACKEND_QUICK_START.md`
- `AWS_MIGRATION_PLAN.md`
- `SYSTEM_FUNCTION_TEST.md`
- `DEPLOYMENT_NEXT_STEPS.md`
- `AWS_DEPLOYMENT_GUIDE.md`
- `SYSTEM_TEST_CHECKLIST.md`
- `LOCALHOST_TROUBLESHOOTING.md`
- `CLEANUP_SUMMARY.md`
- `PHASE2_REPORTS_SUMMARY.md`
- `PHASE1_REPORTS_SUMMARY.md`

### Old Summary Files (6 files)
- `REMOVE_GENERIC_NAME_SUMMARY.md`
- `INVENTORY_MERGE_SUMMARY.md`
- `PHARMA_CLEANUP_FINAL.md`
- `USER_REDUCTION_SUMMARY.md`
- `ORDER_TRACKING_FIXES.md`
- `LOGO_FAVICON_UPDATE.md`
- `PHARMA_REMOVAL_SUMMARY.md`
- `LIQUOR_WHOLESALE_UPDATE.md`
- `REBRAND_SUMMARY.md`

### Old Plan Files (1 file)
- `rebrand-to-herb-toddy.plan.md`

## Code Cleanup Tasks

### 1. Remove Debug Console Logs
Remove or convert to production logging:
- `src/pages/Customers.tsx` - 7 console logs
- `src/pages/Products.tsx` - 20 console logs
- `src/pages/Orders.tsx` - 35 console logs
- `src/pages/Reports.tsx` - 1 console log
- `src/components/Layout.tsx` - 3 console logs
- `src/components/Dashboard.tsx` - 3 console logs
- `src/pages/SharedCatalogs.tsx` - 4 console logs
- `src/contexts/AuthContext.tsx` - 2 console logs
- `src/pages/CustomerPortals.tsx` - 7 console logs
- `src/pages/Users.tsx` - 4 console logs
- `src/pages/ProductCatalog.tsx` - 3 console logs
- `src/components/reports/SalesRepPerformance.tsx` - 1 console log
- `src/pages/NotFound.tsx` - 1 console error (keep for 404 tracking)

### 2. Backend Server (Keep minimal)
- `backend/server.js` - Keep 4 console logs (startup errors only)

### 3. Remove Unused Imports
Scan all TypeScript files for unused imports

### 4. Build Artifacts
- `dist/` directory - Generated, keep in .gitignore
- `node_modules/` - Keep in .gitignore

## Summary
- **Files to remove:** ~49 files
- **Console logs to clean:** ~90 instances
- **Files to keep:** ~30 essential files
- **Result:** Clean, production-ready codebase

## Action Plan
1. Delete all unnecessary markdown files
2. Remove debug console.logs from source code
3. Keep only essential console errors
4. Clean up unused imports
5. Final commit and push
