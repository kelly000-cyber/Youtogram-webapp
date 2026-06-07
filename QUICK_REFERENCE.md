# ⚡ Railway Deployment Quick Reference Card

## 🎯 Start Here

1. Go to [railway.app](https://railway.app)
2. Login with GitHub
3. Click "New Project"
4. Deploy from GitHub
5. Select your repo
6. Follow the checklist below

---

## 📋 Backend Deployment Checklist

### Service Configuration
- [ ] Service root: `server`
- [ ] Wait for build complete (green ✓)

### Add MongoDB Database
- [ ] Click "Add Service" → "Database" → "MongoDB"
- [ ] Wait for MongoDB to provision

### Environment Variables
```
NODE_ENV                 = production
JWT_SECRET               = [run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
MONGO_URI                = ${{MongoDB.MONGO_URL}}
FRONTEND_URL             = [leave empty for now]
PORT                     = 3000
```

### Deploy
- [ ] Click "Deploy" button
- [ ] Wait for green checkmark (3-5 min)
- [ ] Copy backend domain from top

**Backend URL:** `https://your-backend.up.railway.app`

---

## 📋 Frontend Deployment Checklist

### Service Configuration
- [ ] Service root: `client`
- [ ] Wait for build complete (green ✓)

### Environment Variables
```
NEXT_PUBLIC_API_URL      = https://your-backend.up.railway.app/api
NEXT_PUBLIC_SOCKET_URL   = https://your-backend.up.railway.app
```

### Deploy
- [ ] Click "Deploy" button
- [ ] Wait for green checkmark (3-5 min)
- [ ] Copy frontend domain from top

**Frontend URL:** `https://your-frontend.up.railway.app`

---

## 📋 Final Backend Update

### Add Frontend URL
1. Go to backend service
2. Click "Variables"
3. Set `FRONTEND_URL` = your frontend URL
4. Click "Redeploy"
5. Wait for success (2-3 min)

---

## ✅ Testing Checklist

### Health Check
- [ ] Visit: `https://backend/api/health`
- [ ] Should see JSON response

### Frontend
- [ ] Visit: `https://frontend/`
- [ ] Login page displays

### Authentication
- [ ] Click "Create Account"
- [ ] Fill form and submit
- [ ] Redirects to feed

### Features
- [ ] Create a post
- [ ] Post appears in feed
- [ ] Can like post
- [ ] Can comment on post
- [ ] Open 2 windows: posts appear instantly (real-time)

### Console Check
- [ ] Press F12 (DevTools)
- [ ] Go to Console tab
- [ ] No RED error messages
- [ ] Only green/gray text is normal

---

## 🚨 Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| CORS error | Update backend `FRONTEND_URL`, redeploy |
| Can't reach API | Check `NEXT_PUBLIC_API_URL`, redeploy frontend |
| WebSocket fails | Check `NEXT_PUBLIC_SOCKET_URL`, redeploy |
| Build fails | Run `npm install` locally, commit `package-lock.json`, push |
| Page blank | Check Network tab (F12), look for failed requests |

---

## 🔗 Environment Variable Template

### Backend
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-random-32-char-secret
MONGO_URI=${{MongoDB.MONGO_URL}}
FRONTEND_URL=https://your-frontend-url.up.railway.app
```

### Frontend
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.up.railway.app
```

---

## 📚 Documentation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [DEPLOYMENT_GUIDE_INDEX.md](./DEPLOYMENT_GUIDE_INDEX.md) | Navigation guide | Before starting |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Pre-flight checks | Before deploying |
| [RAILWAY_STEP_BY_STEP.md](./RAILWAY_STEP_BY_STEP.md) | Detailed walkthrough | During deployment |
| [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md) | Problem solutions | If issues occur |
| [README.md](./README.md) | Project overview | Anytime |

---

## 💾 Useful Commands

```bash
# Generate random JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test local backend
curl http://localhost:5000/api/health

# Check Git status
git status

# Push to GitHub
git add . && git commit -m "message" && git push origin main
```

---

## 🎯 Success = All of This Works

✅ Backend health check returns JSON  
✅ Frontend login page displays  
✅ Can register and login  
✅ Feed shows posts  
✅ Creating posts works  
✅ Socket.io connected (real-time features work)  
✅ No errors in console (F12)  
✅ No CORS errors  

---

## ⏱️ Time Estimate

- Setup: 2 min
- Backend deploy: 8 min
- Frontend deploy: 8 min
- Testing: 5 min
- **Total: 23 min** ⚡

---

## 🆘 SOS

**Something broken?**
1. Check your logs: Railway Dashboard → Service → Deployments → Logs
2. Read [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md)
3. Most issues have simple fixes!

**Can't remember a step?**
→ Read [RAILWAY_STEP_BY_STEP.md](./RAILWAY_STEP_BY_STEP.md)

**Missing something?**
→ Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## 📞 Quick Links

- Railway Docs: https://railway.app/docs
- Next.js Docs: https://nextjs.org/docs
- Express Docs: https://expressjs.com
- MongoDB: https://docs.mongodb.com

---

## 🎉 You're Live!

After successful deployment:

**Share with friends:**
```
https://your-frontend-url.up.railway.app
```

**Monitor with:**
- Railway dashboard (check metrics)
- Browser DevTools (check console)
- Real user testing

**Update easily:**
```bash
git push origin main  # Railway auto-deploys!
```

---

**Keep this card handy during deployment! 📌**

**30 minutes to live. You got this! 🚀**
