# Localhost Troubleshooting Guide

## Problem: http://localhost:5173 not working

## Quick Fixes

### 1. **Kill any existing processes on port 5173**

```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### 2. **Clean install and restart**

```bash
cd /Users/nextmac/Downloads/herbexint

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Fresh install
npm install

# Start dev server
npm run dev
```

### 3. **Check for compilation errors**

The server might be running but showing errors. Check:
- Open browser console (F12)
- Look for JavaScript errors
- Check terminal for build errors

### 4. **Use different port**

If port 5173 is blocked, use a different port:

```bash
npm run dev -- --port 3000
```

Then open: http://localhost:3000

### 5. **Clear browser cache**

- Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- Clear cache and cookies
- Try again

### 6. **Check if Vite is actually running**

Open terminal in the project folder and run:

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

If you see errors instead, there's a compilation issue.

### 7. **Common Errors and Fixes**

#### Error: "Cannot find module"
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

#### Error: Port already in use
```bash
# Kill the process
lsof -ti:5173 | xargs kill -9
npm run dev
```

#### Error: "Failed to load resource"
- Check browser console for specific errors
- Make sure all imports are correct

### 8. **Alternative: Use npm run preview**

If dev doesn't work, try building first:

```bash
npm run build
npm run preview
```

This will run the built version on a different port.

### 9. **Check File Permissions**

Make sure you have read/write permissions:

```bash
chmod -R 755 /Users/nextmac/Downloads/herbexint
```

### 10. **Last Resort: Fresh Clone**

If nothing works, start fresh:

```bash
cd /Users/nextmac/Downloads
# Backup your changes if needed
cp -r herbexint herbexint_backup

# Then try again
cd herbexint
npm install
npm run dev
```

## Still Not Working?

Share the error message from:
1. Browser console (F12)
2. Terminal output
3. Network tab in browser dev tools

This will help diagnose the specific issue.
