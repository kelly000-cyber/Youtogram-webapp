# Railway Deployment Guide - Youtogram

## Complete Step-by-Step Deployment Instructions

### Prerequisites
- GitHub account with this repo pushed
- Railway account (railway.app)
- MongoDB Atlas account (optional - Railway provides MongoDB)

---

## Phase 1: Initial Setup (5 minutes)

### Step 1: Login to Railway
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"

### Step 2: Create Backend Service
1. Select "Deploy from GitHub"
2. Choose your repository
3. Click "Create Project"
4. Wait for initial build (takes ~3-5 minutes)

---

## Phase 2: Backend Configuration (10 minutes)

### Step 3: Configure Backend Service Settings

1. **Access Service Settings**
   - Go to your Railway Dashboard
   - Click on the backend service
   - Click "Settings" tab

2. **Set Service Root Directory**
   - In Settings, find "Service Root Directory"
   - Set it to: `server`
   - Click "Update"

3. **Add MongoDB Database**
   - Click "+" to add a new service
   - Select "Database" → "MongoDB"
   - Railway will auto-provision it
   - The database service name will be "MongoDB"

4. **Set Environment Variables**
   - Click "Variables" tab
   - Add these variables:

```
NODE_ENV=production
JWT_SECRET=your-super-secret-key-min-32-characters-long
PORT=3000
```

   - Do NOT set `MONGO_URI` or `FRONTEND_URL` yet
   - Railway auto-injects MongoDB connection string

5. **Link MongoDB Service**
   - In the Variables tab, click "Reference"
   - For `MONGO_URI`, reference `${{MongoDB.MONGO_URL}}`
   - This auto-connects to your MongoDB

### Step 4: Deploy Backend
- Click "Deploy" button
- Monitor logs for deployment
- Wait for "Deployment successful" message
- Note your backend URL (looks like: `https://youtogram-api.up.railway.app`)

---

## Phase 3: Frontend Configuration (10 minutes)

### Step 5: Create Frontend Service

1. **Create New Service in Same Project**
   - Go back to Project Dashboard
   - Click "+" to add service
   - Select "Deploy from GitHub"
   - Select same repository
   - Railway creates a new frontend service

2. **Configure Frontend Settings**
   - Click on the new frontend service
   - Click "Settings" tab
   - Set "Service Root Directory" to: `client`
   - Save changes

3. **Add Environment Variables**
   - Click "Variables" tab
   - Add these variables:

```
NEXT_PUBLIC_API_URL=https://[YOUR-BACKEND-URL]/api
NEXT_PUBLIC_SOCKET_URL=https://[YOUR-BACKEND-URL]
```

   - Replace `[YOUR-BACKEND-URL]` with your actual backend domain
   - Example: `https://youtogram-api.up.railway.app/api`

### Step 6: Deploy Frontend
- Click "Deploy" button
- Monitor deployment
- Wait for success
- Note your frontend URL

---

## Phase 4: Final Backend Configuration (5 minutes)

### Step 7: Update Backend with Frontend URL

1. **Get Frontend Domain**
   - Copy your frontend deployment URL
   - Example: `https://youtogram-web.up.railway.app`

2. **Update Backend Variables**
   - Go to backend service → Variables
   - Find or add: `FRONTEND_URL`
   - Set value to your frontend URL
   - Save changes

3. **Trigger Backend Redeployment**
   - Go to "Deployments" tab
   - Click "Redeploy" on latest deployment
   - This applies the new CORS configuration
   - Wait for deployment to complete

---

## Phase 5: Testing & Verification (5 minutes)

### Step 8: Verify Deployment

1. **Test Backend Health**
   - Visit: `https://[YOUR-BACKEND-URL]/api/health`
   - You should see: `{"status":"success","message":"Youtogram API is running"...}`

2. **Test Frontend Access**
   - Visit: `https://[YOUR-FRONTEND-URL]`
   - You should see the login page
   - Page should load without CORS errors

3. **Test Authentication**
   - Register a test account
   - Login successfully
   - Check browser console (F12) for no errors
   - Verify you can access the feed

4. **Test Real-time Features**
   - Open two browser windows to same site
   - Create a post in one window
   - Verify it appears in the other (socket.io working)

---

## Common Issues & Solutions

### Issue 1: CORS Errors
**Error:** "Access to XMLHttpRequest blocked by CORS policy"
**Solution:**
- Verify `FRONTEND_URL` is set correctly on backend
- Ensure no trailing slashes in URLs
- Redeploy backend after changing `FRONTEND_URL`

### Issue 2: MongoDB Connection Failed
**Error:** "Cannot connect to MongoDB"
**Solution:**
- Verify MongoDB service is added to project
- Check `MONGO_URI` variable is set
- Redeploy backend
- Check Railway logs for connection details

### Issue 3: Socket.io Not Connecting
**Error:** "WebSocket connection to... failed"
**Solution:**
- Verify `NEXT_PUBLIC_SOCKET_URL` matches backend URL
- Ensure backend is using Socket.io properly
- Clear browser cache
- Restart frontend deployment

### Issue 4: Environment Variables Not Updating
**Solution:**
- After changing variables, click "Redeploy"
- Wait for deployment to complete
- Clear browser cache (Ctrl+Shift+Delete)
- Don't just refresh

### Issue 5: Build Failures
**Solution:**
- Check Railway logs for specific error
- Common: Missing dependencies
  - Run locally: `npm install` in both server and client
  - Commit `package-lock.json`
  - Push to GitHub
  - Redeploy

---

## Environment Variables Reference

### Backend (.env or Railway Variables)
```
NODE_ENV=production
PORT=3000                                    # Set by Railway
MONGO_URI=${{MongoDB.MONGO_URL}}            # Reference Railway MongoDB
JWT_SECRET=your-min-32-char-secret-key     # Set strong secret
FRONTEND_URL=https://your-frontend.up.railway.app
```

### Frontend (.env.local or Railway Variables)
```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend.up.railway.app
```

---

## Post-Deployment Checklist

- [ ] Backend service deployed successfully
- [ ] MongoDB connected and working
- [ ] Frontend service deployed successfully
- [ ] FRONTEND_URL set on backend
- [ ] NEXT_PUBLIC_API_URL set on frontend
- [ ] NEXT_PUBLIC_SOCKET_URL set on frontend
- [ ] Backend redeployed after all variable changes
- [ ] Health check endpoint returns 200
- [ ] Registration works
- [ ] Login works
- [ ] Feed loads posts
- [ ] Socket.io features work (real-time updates)
- [ ] No CORS errors in console
- [ ] No WebSocket connection errors

---

## Advanced: Database Management

### Backup MongoDB
- Railway includes automated backups
- Access via Railway dashboard
- Database section shows backup schedule

### Monitor Database
- Go to MongoDB service in Railway
- Click "Metrics" tab to see:
  - Connection count
  - Operation counts
  - Storage usage
  - CPU/Memory usage

### Scale Resources
- Click MongoDB service
- Click "Settings"
- Adjust resources if hitting limits
- Scaling doesn't cause downtime

---

## Advanced: Custom Domain (Optional)

1. **Add Custom Domain**
   - Backend service → Settings → Domain
   - Click "Add Custom Domain"
   - Use: `api.yourdomain.com`

2. **Update DNS**
   - Go to your domain registrar
   - Add CNAME record pointing to Railway domain
   - Wait for DNS propagation (5-30 minutes)

3. **Update Frontend Environment**
   - Change `NEXT_PUBLIC_API_URL` to new domain
   - Redeploy frontend

---

## Performance Tips

1. **Enable CDN (Paid)**
   - Railway Settings → Enable CDN
   - Dramatically speeds up frontend

2. **Optimize Images**
   - Compress before uploading
   - Use WebP format when possible

3. **Monitor Metrics**
   - Check CPU/Memory usage in Railway
   - Scale up if hitting limits
   - Use Railway's horizontal scaling

4. **Database Indexing**
   - Already configured in models
   - Monitor query performance in logs

---

## Support & Debugging

### View Real-time Logs
1. Go to service dashboard
2. Click "Deployments" tab
3. Click latest deployment
4. View live logs as they happen

### Common Log Messages
- `ECONNREFUSED` = Service not started or crashed
- `MongoError` = Database connection issue
- `EADDRINUSE` = Port already in use
- Check logs for exact error messages

### Get Help
- Railway Docs: [railway.app/docs](https://railway.app/docs)
- GitHub Issues: Report problems in your repo
- Railway Community: Discord support available

---

## Total Deployment Time: ~30-45 minutes

Good luck! 🚀
