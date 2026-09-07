# Complete Railway Deployment - Step by Step

## 🎯 What You'll Do

By the end of this guide, you'll have:
- ✅ Backend running on Railway with MongoDB
- ✅ Frontend running on Railway  
- ✅ Real-time features working
- ✅ Custom domain (optional)
- ✅ Automated deployments from GitHub

**Time needed: 30-45 minutes**

---

## 📋 Prerequisites (5 minutes)

Before starting, ensure:

1. **GitHub Account**
   - Your code pushed to GitHub
   - Repository is accessible

2. **Local Testing Complete**
   ```bash
   cd server && npm start     # Backend runs
   cd ../client && npm start  # Frontend runs
   ```
   - Login page loads
   - Can register and login
   - Feed loads posts

3. **Environment Files**
   - `server/.env.example` exists
   - `client/.env.example` exists
   - Both have all required variables

4. **Git Repository Ready**
   ```bash
   cd massblogga project
   git status                 # Should be clean
   git push origin main       # Latest code on GitHub
   ```

---

## 🚀 Phase 1: Create Railway Account (2 minutes)

### Step 1: Create Account
1. Go to [railway.app](https://railway.app)
2. Click "Login with GitHub" (top right)
3. Authorize Railway to access GitHub
4. You'll be redirected to Railway dashboard

### Step 2: Create Project
1. Click "New Project" (blue button)
2. Select "Deploy from GitHub repo"
3. **Choose repository:** massblogga project (or your repo name)
4. Click "Create project"
5. Wait for Railway to analyze your repo (1-2 minutes)

---

## 🔧 Phase 2: Deploy Backend (12 minutes)

### Step 3: Configure Backend Service

**What you see:**
- A service card labeled "server" (or your backend name)
- Status might be "building"

**Action:**
1. Click the "server" service card
2. Go to **"Settings"** tab (right side)
3. Find **"Service Root Directory"**
4. Set to: `server`
5. Click the "Update" or checkmark button
6. Wait 30 seconds for update

### Step 4: Add MongoDB Database

**Action:**
1. Go back to project dashboard (click project name at top)
2. Click **"Add Service"** button (or "+" icon)
3. Select **"Create New"** → **"Database"** → **"MongoDB"**
4. Wait for MongoDB service to appear (2-3 minutes)
5. Click on "MongoDB" service
6. Go to **"Connect"** tab
7. Copy the **Database URL** (starts with `mongodb+srv://`)

**In a new tab,** continue with environment variables...

### Step 5: Set Backend Environment Variables

**Action:**
1. Go back to backend service (click "server")
2. Click **"Variables"** tab
3. Add these variables one by one:

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| JWT_SECRET | *generate-secret-below* |
| MONGO_URI | ${{MongoDB.MONGO_URL}} |
| FRONTEND_URL | *leave empty for now* |
| PORT | 3000 |

**How to generate JWT_SECRET:**
```bash
# In your terminal, run:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output (long string of letters/numbers)
# Paste as JWT_SECRET value
```

**For MONGO_URI:**
- Don't paste the URL manually
- Click the variable field
- Select "Add reference"
- Choose: `${{MongoDB.MONGO_URL}}`
- This auto-connects to your MongoDB

### Step 6: Deploy Backend

**Action:**
1. Backend service should show all variables set
2. Look for blue "Deploy" button (top right)
3. Click "Deploy"
4. Watch the deployment progress
5. Look for green checkmark (✓) "Deployment successful"
6. This takes 2-5 minutes

**Verify it worked:**
1. Click the deployed service
2. Go to "Deployments" tab
3. Find your latest deployment
4. Click it to see logs
5. Logs should end with: `Youtogram backend listening on 0.0.0.0:3000`

**Note your backend URL:**
- Click service again
- Look at top - you'll see a domain like:
  - `https://youtogram-api.up.railway.app`
- Copy this URL - you'll need it soon
- Test it: visit `https://your-backend/api/health`
- Should show JSON with status

---

## 🎨 Phase 3: Deploy Frontend (12 minutes)

### Step 7: Create Frontend Service

**Action:**
1. Go to project dashboard
2. Click "Add Service"
3. Select "Deploy from GitHub repo"
4. Choose SAME repository again
5. Railway creates a new frontend service
6. Wait for it to appear (1 minute)

### Step 8: Configure Frontend Service

**Action:**
1. Click the new frontend service
2. Go to "Settings"
3. Set "Service Root Directory" to: `client`
4. Click Update
5. Wait 30 seconds

### Step 9: Set Frontend Environment Variables

**Action:**
1. Click frontend service
2. Go to "Variables" tab
3. Add these variables:

| Key | Value |
|-----|-------|
| NEXT_PUBLIC_API_URL | `https://your-backend.up.railway.app/api` |
| NEXT_PUBLIC_SOCKET_URL | `https://your-backend.up.railway.app` |

**Replace `your-backend` with:**
- The domain from Phase 2 Step 6
- Example: `https://youtogram-api.up.railway.app/api`

### Step 10: Deploy Frontend

**Action:**
1. Look for blue "Deploy" button
2. Click Deploy
3. Watch deployment progress
4. Wait for green checkmark (takes 3-5 minutes)
5. Frontend is now live!

**Get your frontend URL:**
- At top of service, you'll see domain like:
  - `https://youtogram-web.up.railway.app`
- Copy this URL
- Test it: visit `https://your-frontend/`
- Should show login page

---

## 🔐 Phase 4: Final Configuration (5 minutes)

### Step 11: Update Backend with Frontend URL

Now backend knows where frontend is coming from:

**Action:**
1. Go back to backend service
2. Click "Variables"
3. Find `FRONTEND_URL` (you left it empty)
4. Set it to your frontend URL
   - Example: `https://youtogram-web.up.railway.app`
5. NO trailing slash at end
6. Save

### Step 12: Redeploy Backend

This is CRITICAL - backend won't allow frontend requests without this:

**Action:**
1. Click backend service
2. Go to "Deployments" tab
3. Find your latest deployment
4. Click the three dots (...)
5. Select "Redeploy"
6. Wait for green checkmark
7. This takes 2-3 minutes

---

## ✅ Phase 5: Testing (5 minutes)

### Step 13: Verify Everything Works

**Test 1: Backend Health**
```
Visit: https://your-backend/api/health
Expected: JSON response with status: "success"
```

**Test 2: Login Page Loads**
```
Visit: https://your-frontend/
Expected: Login/Register page displays
```

**Test 3: Registration**
1. Go to frontend URL
2. Click "Create Account"
3. Fill in form:
   - Username: testuser123
   - Country: Nigeria (or your country)
   - Email: test@example.com
   - Phone: 8012345678
   - Password: Test@1234
4. Click "Create Account"
5. Should redirect to feed

**Test 4: Login**
1. If registration succeeded, you're logged in ✓
2. If not, use email and password to login
3. Should see "Loading your feed..."
4. Feed should load

**Test 5: Check for Errors**
1. Open DevTools: Press F12
2. Go to "Console" tab
3. Should see NO red error messages
4. Green messages are fine
5. If you see CORS error, wait and re-check (FRONTEND_URL might not have applied yet)

**Test 6: Create a Post**
1. On feed page, look for "Create Post" button
2. Click it
3. Type a message: "Test post from Railway!"
4. Click "Post"
5. Should appear in feed immediately

**Test 7: Real-time Features**
1. Open two browser windows
2. Both logged in
3. In window 1, create a post
4. In window 2, you should see it appear without refreshing
5. This proves Socket.io is working

---

## 🎉 Success! You're Live!

If you made it here and all tests passed:

✅ **Backend:** Running on Railway with MongoDB  
✅ **Frontend:** Running on Railway  
✅ **Database:** Connected and storing data  
✅ **Real-time:** Socket.io working  
✅ **Authentication:** Working  
✅ **Features:** Posts, likes, comments working  

---

## 📱 Share Your App!

Send this link to friends:
```
https://your-frontend.up.railway.app
```

They can:
- Create an account
- Post content
- See your feed
- Send messages
- Play games
- Watch videos

---

## 🔄 Continuous Deployment

From now on, every time you:
```bash
git push origin main
```

Railway will automatically:
1. Detect code change
2. Build new version
3. Deploy new version
4. Zero downtime update

---

## 🛠 Making Changes Later

When you update code:

```bash
# Edit code locally
# Test locally: npm run dev
# Push to GitHub:
git add .
git commit -m "Feature: describe changes"
git push origin main

# Railway automatically deploys!
# Check Railway dashboard to see progress
```

---

## 📊 Monitor Your App

Regular check-ins:

1. **Weekly:** 
   - Check Railway dashboard
   - Look at metrics (CPU, Memory)
   - Review error logs

2. **If Issues Occur:**
   - Check logs first
   - Read troubleshooting guide
   - Check environment variables

3. **Celebrate Success:**
   - Share with friends
   - Collect feedback
   - Plan new features

---

## 🆘 If Something Goes Wrong

Don't panic! Most issues have simple fixes:

1. **Check logs** (Deployments → Logs)
2. **Check environment variables** (all set?)
3. **Redeploy** (click Redeploy button)
4. **Clear cache** (Ctrl+Shift+Delete)
5. **See [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md)**

---

## 📚 Next Steps

After successful deployment:

1. **Add Custom Domain** (optional)
   - Buy domain
   - Update DNS
   - Point to Railway
   - Configure SSL

2. **Monitor Performance**
   - Set up error tracking (Sentry)
   - Set up analytics
   - Monitor user growth

3. **Improve App**
   - Gather user feedback
   - Fix bugs
   - Add new features
   - Optimize speed

4. **Scale as Needed**
   - Upgrade server tier
   - Optimize database
   - Add caching layer
   - Load testing

---

## 🎓 Learn More

- [Railway Documentation](https://railway.app/docs)
- [Next.js Deployment](https://nextjs.org/learn/basics/deploying-nextjs-app)
- [MongoDB Docs](https://docs.mongodb.com)
- [Express.js Guide](https://expressjs.com)
- [Socket.io Tutorial](https://socket.io/docs)

---

**Congratulations! You've just deployed a full-stack social media app! 🚀🎉**

Your app is now live and ready for users to enjoy. Share it proudly!
