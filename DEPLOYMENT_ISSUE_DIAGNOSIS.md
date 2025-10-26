# Deployment Issue Diagnosis

## Issue
**Backend deployment to EC2 is not working after multiple attempts.**

## What Was Fixed

### 1. Initial Issue Found
❌ **Problem:** Deployment workflow only deployed frontend, not backend
✅ **Fix:** Added backend deployment steps to workflow

### 2. Second Issue Found  
❌ **Problem:** Backend restart step used `PRE_COMMANDS` which may not execute properly
✅ **Fix:** Separated into two steps:
   - Install backend dependencies
   - Restart backend service

## Current Status

**Latest Commit:** 77ffe79 - "Fix backend deployment - separate install and restart steps"
**Deployment Time:** Ongoing
**Test Results:** 21/26 (81%) - Backend still on old code

## Possible Causes

1. **GitHub Actions Not Running**
   - Check if Actions tab shows deployment running
   - Verify secrets are configured (EC2_SSH_KEY, EC2_HOST)

2. **Backend PM2 Not Running**
   - PM2 service might not be installed
   - Backend process might have crashed

3. **Network/Firewall Issues**
   - SSH connection from GitHub Actions to EC2 failing
   - Security group not allowing connections

4. **File Permissions**
   - Backend files deployed but not executable
   - PM2 can't start the process

## Debugging Steps

### 1. Check GitHub Actions Status
Go to: https://github.com/lakshanthilakarathna/herbexint/actions
Look for latest workflow run and check for errors

### 2. Manual SSH to EC2
```bash
ssh -i ~/Downloads/herbexint.pem ubuntu@ec2-13-41-78-113.eu-west-2.compute.amazonaws.com

# Check if backend is running
pm2 status

# Check if backend directory exists
ls -la /var/www/herbexint-api/

# Check backend logs
pm2 logs herb-backend
```

### 3. Manual Backend Restart
```bash
cd /var/www/herbexint-api
npm install
pm2 restart herb-backend
# or if not running:
pm2 start server.js --name herb-backend
pm2 save
```

### 4. Check EC2 Backend Status
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/system-logs
```

## Solutions

### Immediate Fix (Manual)
1. SSH into EC2
2. Deploy backend manually
3. Restart PM2 service
4. Verify it's working

### Automated Fix (Recommended)
1. Check GitHub Actions logs
2. Fix any errors in workflow
3. Re-trigger deployment
4. Monitor deployment process

## Expected Behavior

After successful deployment:
- Backend should be at `/var/www/herbexint-api`
- PM2 should manage the backend process
- Backend should respond on port 3001
- System logs API should work
- All 25/26 tests should pass

## Next Steps

1. ✅ Fixed deployment workflow
2. ⏳ Wait for GitHub Actions to complete
3. ⏳ Verify deployment succeeded
4. ⏳ Test system logs API
5. ⏳ Confirm all tests pass

---

*Last Updated: 2025-01-26*
*Issue: Backend deployment pending*
*Status: Troubleshooting in progress*
