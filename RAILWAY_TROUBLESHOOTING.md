# Railway Deployment Troubleshooting Guide

## Quick Reference

| Problem | Cause | Solution |
|---------|-------|----------|
| CORS errors | Wrong FRONTEND_URL | Update backend FRONTEND_URL, redeploy |
| Cannot connect to MongoDB | Service not linked | Add MongoDB service, set MONGO_URI variable |
| WebSocket fails | Wrong SOCKET_URL | Update NEXT_PUBLIC_SOCKET_URL, redeploy frontend |
| Build fails | Missing dependencies | Run `npm install`, commit `package-lock.json` |
| Login doesn't work | JWT_SECRET mismatch | Ensure same JWT_SECRET on backend, redeploy |
| Pages load blank | API URL wrong | Verify NEXT_PUBLIC_API_URL, check network tab |

---

## Error Messages & Solutions

### 1. "Access to XMLHttpRequest blocked by CORS policy"

**What it means:** Frontend can't reach backend due to CORS restrictions

**Fix Steps:**
1. Go to Railway dashboard → Backend Service
2. Click "Variables"
3. Find or add: `FRONTEND_URL=https://your-frontend-url.up.railway.app`
4. Make sure NO trailing slash (don't add /)
5. Click "Redeploy"
6. Wait 2-3 minutes for deployment
7. Clear browser cache: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
8. Reload page: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

**Verify it's fixed:**
- Open browser DevTools: F12
- Go to Console tab
- Should see NO red CORS errors
- Network tab shows API calls succeeding

---

### 2. "Cannot POST /api/auth/login"

**What it means:** Frontend can't find backend API

**Quick Check:**
- Copy this URL: `https://your-backend-url.up.railway.app/api/health`
- Paste in browser
- If it shows JSON, backend is running ✓
- If page doesn't load, backend might be down

**Fix Steps:**
1. Check backend status in Railway dashboard
2. If "failed" or "crashed", click "Redeploy"
3. Check backend environment variables are set
4. Check logs: click deployment → "Logs" tab
5. Look for error messages starting with "Error"

---

### 3. "MongoError: connection refused"

**What it means:** Backend can't connect to MongoDB

**Cause:** Usually missing `MONGO_URI` variable

**Fix Steps:**
1. Go to Backend Service → Variables
2. Verify you see: `MONGO_URI=${{MongoDB.MONGO_URL}}`
3. Ensure MongoDB service exists in project
4. If missing, add it: Click "+" → "Database" → "MongoDB"
5. After adding MongoDB, redeploy backend
6. Wait 3-5 minutes for connection to establish

**Check Connection:**
- Backend logs should show: `"MongoDB connected successfully"`
- If still failing, check: `https://your-backend/api/health`
- Database status should show "code: 1" (connected)

---

### 4. "WebSocket connection to ... failed"

**What it means:** Real-time features (notifications, messages, live updates) not working

**Fix Steps:**
1. Go to Frontend Service → Variables
2. Find: `NEXT_PUBLIC_SOCKET_URL`
3. Verify it matches backend domain exactly
4. Should be: `https://your-backend-domain.up.railway.app`
5. NO `/api` at the end
6. NO trailing slash
7. Redeploy frontend
8. Clear cache and reload

**Test Socket Connection:**
- Open DevTools → Network tab
- Look for "ws://" or "wss://" connections
- Should show one connecting to your backend
- Status should change from "pending" to "connected"

---

### 5. "Module not found" / Build failures

**Error Example:**
```
Cannot find module 'axios'
```

**Fix Steps:**
1. On your local machine, go to the failing service directory
   - For backend errors: `cd server`
   - For frontend errors: `cd client`
2. Run: `npm install`
3. Verify `package-lock.json` is updated
4. Commit and push:
   ```bash
   git add package-lock.json
   git commit -m "Update dependencies"
   git push origin main
   ```
5. In Railway, click "Redeploy"

**Prevention:**
- Always run `npm install` locally before deploying
- Commit `package-lock.json` to GitHub
- Don't manually delete node_modules in production

---

### 6. "Internal server error" / 500 errors

**What it means:** Backend had an unexpected error

**Investigate:**
1. Go to Backend Service Deployments
2. Click latest deployment
3. Click "Logs"
4. Look for red text with error details
5. Search for "Error:" to find exact issue

**Common Causes:**
- Database query failed
- Missing environment variable
- Code bug
- Memory limit exceeded

**Fix:**
- Read the error message carefully
- Check logs for line numbers
- Look at corresponding code
- Fix locally and redeploy

---

### 7. "Port already in use"

**What it means:** Can't start service on designated port

**Why it happens:**
- Previous deployment didn't clean up
- Port specified incorrectly

**Fix:**
1. Go to backend service Settings
2. Ensure `PORT` variable is set to `3000`
3. Click "Redeploy"
4. Wait for old containers to terminate (1-2 minutes)

---

### 8. "Memory limit exceeded"

**What it means:** Service using too much RAM

**Check Usage:**
1. Go to service
2. Click "Metrics" tab
3. Look at "Memory" graph
4. If consistently high, it's a problem

**Fix Options:**
- Optimize code (reduce memory leaks)
- Upgrade service plan
- Add pagination to large queries
- Increase MongoDB indexing

---

### 9. "Deployment timeout"

**What it means:** Build/deploy took too long

**Usual Causes:**
- Too many dependencies
- Large build process
- Network issues

**Fix:**
1. Click "Redeploy"
2. If happens again, check local build time
3. Optimize: `npm audit`, remove unused packages
4. Commit and push optimizations

---

### 10. Login page shows but everything is blank

**Causes:** 
- Frontend built but can't reach API
- JavaScript error in console

**Debug:**
1. Open DevTools: F12
2. Go to "Console" tab
3. Look for red error messages
4. Note the error
5. Check Network tab
6. Look for failed API requests

**If API calls show 404:**
- Frontend URL is wrong
- Update `NEXT_PUBLIC_API_URL` on frontend service
- Redeploy frontend

**If API calls hang/timeout:**
- Backend is down
- Go to backend service
- Check if deployment is "running"
- Redeploy if needed

---

## Testing After Fix

After fixing any issue, follow this checklist:

1. **Clear Everything**
   - Browser cache: Ctrl+Shift+Delete
   - Service worker: DevTools → Application → Clear site data
   - Reload page: Ctrl+F5

2. **Check Basics**
   - Can you access login page?
   - Can you register?
   - Can you login?
   - Does feed load?

3. **Check Console**
   - Open DevTools: F12
   - Go to Console tab
   - Should see NO red errors
   - Only warnings are usually OK

4. **Check Network**
   - Open DevTools: F12
   - Go to Network tab
   - Reload page
   - Look for failed requests (red)
   - All API calls should return 200/201

5. **Test All Features**
   - Create a post
   - Like a post
   - Add comment
   - View videos
   - Check messages
   - Send a message

---

## Disaster Recovery

### If Everything is Broken

**Step 1: Revert to Last Working Version**
```bash
git revert HEAD
git push origin main
```

**Step 2: Redeploy in Railway**
- Go to Deployments
- Find last working deployment
- Click "Redeploy"

**Step 3: Database is Safe**
- Even if app crashes, data is safe
- MongoDB has automatic backups
- Accessible in Database service

---

## Getting More Help

### Check Logs for Clues
Most issues are explained in logs:
1. Go to service Deployments
2. Click the failing deployment
3. Click "Logs"
4. Read from bottom up (newest first)
5. Look for "Error:" strings
6. Google the error message

### Common Error Strings to Search
- "ECONNREFUSED" = Can't connect to database
- "EADDRINUSE" = Port conflict
- "Module not found" = Missing dependency
- "Cannot GET /path" = Wrong route
- "CORS" = Cross-origin issue

### Railway Community Support
- Check [railway.app/docs](https://railway.app/docs)
- Railway Discord community
- GitHub Issues in your repo

### Debug Locally First
Before deploying again:
1. Run locally: `npm run dev`
2. Test same operation
3. Check local logs/console
4. Fix locally
5. Commit and push
6. Redeploy to Railway

---

## Prevention Tips

1. **Always test locally before pushing**
2. **Keep git history clean** - easy to revert
3. **Monitor Railway dashboard** - catch issues early
4. **Check logs regularly** - find problems before users do
5. **Keep secrets in environment variables** - never hardcode
6. **Use meaningful commit messages** - easy to find working versions
7. **Read Railway deployment logs** - they tell you everything

---

## Success = Everything Works! 🎉

If you've made it here and all features work:
- ✅ Users can login
- ✅ Posts display
- ✅ Real-time features work
- ✅ No console errors
- ✅ No API errors

**You've successfully deployed Youtogram to Railway!**

Congratulations! 🚀
