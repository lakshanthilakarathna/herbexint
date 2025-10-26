# Troubleshooting - Product Sync Issue

## Problem
Products created on Device A don't appear on Device B immediately.

## Root Cause
Browser cache was serving stale API responses.

## Solution Applied
✅ Added cache-busting headers to all API requests
✅ Added `Cache-Control: no-cache` headers
✅ GET requests now include timestamp parameter

## Testing Steps

### Test 1: Create Product on Device A
1. Open: http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com
2. Login: admin@herb.com / password123
3. Go to Products page
4. Click "Add Product"
5. Fill in details and save

### Test 2: Check on Device B
1. Open same URL on different device/browser
2. Login with same credentials
3. Go to Products page
4. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
5. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
6. Product should appear!

## If Still Not Working

### Check Backend
```bash
# Test API directly
curl http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api/products
```

### Check Browser Console
1. Open DevTools (F12)
2. Go to Network tab
3. Check if requests are going to `/api/products`
4. Check response status (should be 200)

### Clear All Cache
1. Chrome: Settings → Privacy → Clear browsing data
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page

### Hard Refresh
- Windows/Linux: Ctrl + Shift + R or Ctrl + F5
- Mac: Cmd + Shift + R

## Expected Behavior

✅ **Device A creates product** → Saved to backend
✅ **Device B loads page** → Fetches from backend
✅ **Product appears on Device B** → Data synced!

## Backend Status

```bash
# Check backend is running
ssh -i ~/Downloads/herbexint.pem ubuntu@ec2-13-41-78-113.eu-west-2.compute.amazonaws.com
pm2 status

# View backend logs
pm2 logs herb-backend
```

## Contact

If issues persist:
1. Check browser console for errors
2. Verify backend is running (pm2 status)
3. Try incognito/private browsing window

