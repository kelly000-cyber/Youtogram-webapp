# Pre-Deployment Checklist

## Local Setup (Before Pushing to GitHub)

### Backend Setup
- [ ] Run `cd server && npm install`
- [ ] Copy `server/.env.example` to `server/.env`
- [ ] Update `server/.env` with local MongoDB URI
- [ ] Test locally: `npm run dev`
- [ ] Verify backend runs on `http://localhost:5000`
- [ ] Verify health endpoint: `curl http://localhost:5000/api/health`

### Frontend Setup
- [ ] Run `cd client && npm install`
- [ ] Copy `client/.env.example` to `client/.env.local`
- [ ] Keep API_URL pointing to `http://localhost:5000/api`
- [ ] Test locally: `npm run dev`
- [ ] Verify frontend runs on `http://localhost:3000`
- [ ] Test registration/login locally

### Git Preparation
- [ ] Ensure `.env` files are in `.gitignore` (never commit secrets)
- [ ] Ensure `node_modules/` is in `.gitignore`
- [ ] Run `git add .` from project root
- [ ] Commit with message: "Ready for Railway deployment"
- [ ] Push to GitHub: `git push origin main`

---

## Railway Setup Checklist

### GitHub Connection
- [ ] Connect Railway to GitHub account
- [ ] Grant permission to your repository
- [ ] Repository is public or Railway can access it

### Create Project
- [ ] Go to railway.app dashboard
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub"
- [ ] Choose your repository
- [ ] Wait for initial build

### Backend Service Setup
- [ ] Backend service created
- [ ] Service root directory set to `server`
- [ ] MongoDB database service added
- [ ] Environment variables configured (see below)
- [ ] Backend deployment successful

### Environment Variables - Backend
In Railway Backend Service Variables, set:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=generate-a-long-random-string-minimum-32-chars
MONGO_URI=${{MongoDB.MONGO_URL}}
FRONTEND_URL=[EMPTY-FOR-NOW]
```

**How to generate JWT_SECRET:**
- Option 1: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Option 2: Use online tool: random.org (generate 32 random hex chars)
- Make it at least 32 characters long

### Frontend Service Setup
- [ ] Frontend service created
- [ ] Service root directory set to `client`
- [ ] Environment variables configured (see below)
- [ ] Frontend deployment successful

### Environment Variables - Frontend
In Railway Frontend Service Variables, set:

```
NEXT_PUBLIC_API_URL=[YOUR-BACKEND-URL]/api
NEXT_PUBLIC_SOCKET_URL=[YOUR-BACKEND-URL]
```

Replace `[YOUR-BACKEND-URL]` with actual backend domain from Railway.

Example:
```
NEXT_PUBLIC_API_URL=https://youtogram-api.up.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://youtogram-api.up.railway.app
```

### MongoDB Setup
- [ ] MongoDB service running in Railway
- [ ] Connection string auto-provided as `${{MongoDB.MONGO_URL}}`
- [ ] Credentials secure (handled by Railway)
- [ ] Backups enabled

### Final Backend Configuration
After frontend is deployed:
- [ ] Get frontend domain from Railway
- [ ] Update backend `FRONTEND_URL` variable
- [ ] Redeploy backend service
- [ ] Verify deployment successful

---

## Pre-Launch Testing

### Health Checks
- [ ] `GET /api/health` returns status 200
- [ ] Response includes database connection status
- [ ] Response includes database code

### Authentication Flow
- [ ] Can access login page without errors
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] JWT token stored in localStorage
- [ ] Can access authenticated endpoints

### Core Features
- [ ] Can create posts
- [ ] Can view feed
- [ ] Can like/comment on posts
- [ ] Can view videos
- [ ] Can message friends
- [ ] Can play games

### Real-Time Features
- [ ] Socket.io connection established
- [ ] Real-time notifications working
- [ ] Messages deliver in real-time
- [ ] Live feeds update without refresh

### Error Handling
- [ ] Login with wrong password shows error
- [ ] Duplicate email shows error
- [ ] Network errors handled gracefully
- [ ] 404 pages display correctly
- [ ] API errors show user-friendly messages

---

## Deployment Validation

### Metrics Check
- [ ] Backend CPU usage < 50%
- [ ] Backend Memory usage < 512MB
- [ ] Frontend load time < 3 seconds
- [ ] No error logs in Railway dashboard
- [ ] MongoDB storage < limit

### Browser Validation
- [ ] No CORS errors in console
- [ ] No WebSocket errors
- [ ] All images load correctly
- [ ] No 404 on static assets
- [ ] Responsive on mobile

### Security Check
- [ ] HTTPS enabled (automatic with Railway)
- [ ] No sensitive data in logs
- [ ] JWT_SECRET is strong
- [ ] Database credentials not exposed
- [ ] FRONTEND_URL correctly set

---

## Rollback Plan (If Issues Occur)

1. **Keep previous working version**
   - Tag releases in GitHub: `git tag -a v1.0.0`
   - Push tags: `git push origin --tags`

2. **Revert if deployment fails**
   - Go to Railway Deployments
   - Click previous working deployment
   - Click "Redeploy"

3. **Database backup**
   - Railway auto-backs up MongoDB
   - Accessible in Database service settings
   - Download if needed

---

## Success Indicators

✅ Backend deployment successful
✅ Frontend deployment successful
✅ Health endpoint returns 200
✅ Can login successfully
✅ Feed displays posts
✅ Real-time features work
✅ No errors in browser console
✅ No errors in Railway logs
✅ All API endpoints responding

You're ready to launch! 🚀
