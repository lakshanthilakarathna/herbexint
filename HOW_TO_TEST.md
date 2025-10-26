# How to Test Multi-Device Sync

## Current Setup
- Backend: Running on EC2 (Node.js API)
- Storage: JSON file on EC2 server (NOT DynamoDB)
- Frontend: React app on EC2

## Test Steps

### Device A (Create Product)
1. Open: http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com
2. Login: admin@herb.com / password123
3. Go to Products page
4. Click "Add Product"
5. Fill in details:
   - Product Name: "Test Product A"
   - Category: Liquor
   - Wholesale Price: 100
   - Cost Price: 80
   - Retail Price: 120
6. Click "Create Product"
7. ✅ Product should appear in the list

### Device B (View Product)
1. Open same URL on different device/browser
2. Login: admin@herb.com / password123
3. **IMPORTANT: Clear cache first!**
   - Press: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
   - OR: Right-click refresh button → "Empty Cache and Hard Reload"
4. Go to Products page
5. Check if "Test Product A" appears

## Verification

### Check Backend Directly
```bash
curl http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api/products
```

Should show your product in JSON format.

## Troubleshooting

### If Product Not Showing on Device B:

1. **Check browser console** (F12) for errors
2. **Clear ALL cache**:
   - Settings → Clear browsing data
   - Select "All time"
   - Clear data
3. **Try incognito window** (Ctrl + Shift + N)
4. **Check network tab** in DevTools:
   - Are API calls going to `/api/products`?
   - What status code? (should be 200)

### Common Issues

❌ **Old cached JavaScript**
- Fix: Hard refresh (Ctrl + Shift + R)

❌ **API not responding**
- Check: `curl http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api/products`

❌ **Browser cache issue**
- Fix: Use incognito window

## Expected Result

✅ Device A creates product → Shows in list
✅ Device B hard refreshes → Product appears
✅ Both devices see same data

