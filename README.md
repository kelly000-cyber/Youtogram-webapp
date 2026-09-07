<<<<<<< HEAD
# Youtogram 🚀

A full-featured video-first social media platform built with modern web technologies.

## Features

### Core Features ✨
- **User Authentication** - Secure registration & login with JWT tokens
- **Posts & Feed** - Create, like, comment on posts with media (images/videos)
- **Friends System** - Send friend requests, manage friends list
- **Video Streaming** - Upload and share videos with quality options
- **Real-time Messaging** - Socket.io powered instant messaging
- **Games** - Embedded games for users to play and share
- **Live Streaming** - Real-time video streaming capabilities
- **Notifications** - Real-time alerts for likes, comments, friend requests
- **Saved Posts** - Bookmark and save favorite posts
- **User Settings** - Privacy controls, block/mute users, preferences
- **Search** - Global search for users and posts with history
- **Groups** - Create and manage community groups

---

## Technology Stack

### Backend
- **Runtime:** Node.js + Express.js
- **Database:** MongoDB with Mongoose ODM
- **Real-time:** Socket.io for WebSockets
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** bcryptjs, helmet, CORS

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** JavaScript (React 18)
- **Real-time Client:** socket.io-client
- **HTTP Client:** SWR (stale-while-revalidate)
- **Styling:** CSS modules + custom styles

---

## Project Structure

```
massblogga project/
├── server/                    # Backend (Express + MongoDB)
│   ├── src/
│   │   ├── app.js            # Express app setup
│   │   ├── server.js         # Server entry point
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Auth & error handling
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── sockets/          # WebSocket handlers
│   │   └── utils/            # Utilities
│   ├── package.json
│   └── railway.json          # Railway config
│
├── client/                    # Frontend (Next.js)
│   ├── app/
│   │   ├── layout.js         # Root layout
│   │   ├── page.js           # Auth page
│   │   └── [routes]/         # Feature pages
│   ├── components/           # React components
│   ├── hooks/                # Custom hooks
│   ├── services/             # API clients
│   ├── context/              # React context
│   ├── data/                 # Static data
│   ├── public/               # Static assets
│   ├── globals.css           # Global styles
│   ├── package.json
│   └── railway.json          # Railway config
│
├── RAILWAY_DEPLOYMENT.md     # 📖 Deployment guide
├── DEPLOYMENT_CHECKLIST.md   # ✅ Pre-deployment checks
├── RAILWAY_TROUBLESHOOTING.md # 🔧 Troubleshooting guide
└── README.md                 # This file
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB installed or MongoDB Atlas account

### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```
Runs on `http://localhost:5000`

### Frontend Setup
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:3000`

---

## Deployment 🚀

### Quick Deploy to Railway (Recommended)

**Total time: ~45 minutes**

#### Step 1: Prepare GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Create Railway Services
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select this repository
4. Create backend service (root: `server`)
5. Add MongoDB database
6. Create frontend service (root: `client`)

#### Step 3: Configure Environment
**Backend Variables:**
```env
NODE_ENV=production
JWT_SECRET=your-random-32-char-secret
MONGO_URI=${{MongoDB.MONGO_URL}}
FRONTEND_URL=https://your-frontend.up.railway.app
```

**Frontend Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend.up.railway.app
```

#### Step 4: Deploy & Test
- Redeploy backend after setting FRONTEND_URL
- Visit frontend URL
- Test registration & login
- Check browser console for errors

**For detailed instructions, see [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)**

### Alternative: Manual Deploy
Other deployment options:
- **Heroku** - Traditional PaaS (see Procfile config)
- **Vercel** - Frontend only (Next.js native)
- **AWS/GCP** - Full cloud control
- **Self-hosted** - VPS or dedicated server

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production|development
PORT=3000
HOST=0.0.0.0
MONGO_URI=mongodb://user:pass@host/dbname
JWT_SECRET=minimum-32-characters-long-secret
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get profile
- `GET /api/auth/users` - List all users
- `POST /api/auth/friends/:id` - Send friend request

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts` - Get feed
- `PUT /api/posts/:id/like` - Toggle like
- `POST /api/posts/:id/comment` - Add comment

### Videos
- `POST /api/videos` - Upload video
- `GET /api/videos` - List videos
- `PUT /api/videos/:id/like` - Like video
- `POST /api/videos/:id/comment` - Comment on video

### Chat
- `GET /api/chat/conversations` - Get chats
- `GET /api/chat/messages/:chatId` - Get messages
- `POST /api/chat/messages` - Send message

### Games
- `GET /api/games` - List games
- `POST /api/games` - Add game
- `GET /api/games/history` - Game sessions
- `POST /api/games/session` - Create session

### Live
- `POST /api/live/session` - Start live
- `GET /api/live/sessions` - Get live streams
- `POST /api/live/session/:id/join` - Join stream

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread` - Unread count
- `PUT /api/notifications/:id/read` - Mark read
- `DELETE /api/notifications/:id` - Delete

### Saved Posts
- `POST /api/saved/:postId` - Save post
- `GET /api/saved` - Get saved posts
- `GET /api/saved/:postId` - Check if saved

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/block/:userId` - Block user
- `POST /api/settings/mute/:userId` - Mute user

### Search
- `GET /api/search?q=query` - Global search
- `GET /api/search/users?q=query` - Search users
- `GET /api/search/posts?q=query` - Search posts
- `GET /api/search/history` - Search history
- `DELETE /api/search/history` - Clear history

---

## Troubleshooting

### Common Issues

**CORS Error**
- Update backend `FRONTEND_URL` env variable
- Redeploy backend
- Clear browser cache

**WebSocket Not Connecting**
- Verify `NEXT_PUBLIC_SOCKET_URL` on frontend
- Ensure backend is running
- Check browser console for WebSocket errors

**MongoDB Connection Failed**
- Verify `MONGO_URI` is set correctly
- Ensure MongoDB service is running
- Check network connectivity

**Build Fails on Railway**
- Run `npm install` locally
- Commit `package-lock.json`
- Push to GitHub
- Redeploy

**See [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md) for comprehensive troubleshooting guide**

---

## Production Checklist

Before launching:

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL/HTTPS enabled
- [ ] API rate limiting configured
- [ ] Error monitoring setup (Sentry, etc.)
- [ ] Security headers enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Password reset flow implemented
- [ ] User deletion flow implemented
- [ ] Data backup strategy in place
- [ ] Monitoring/alerting configured
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] User privacy policy in place
- [ ] Terms of service in place

---

## Performance Tips

1. **Database Indexing** - Already configured on critical fields
2. **Image Optimization** - Compress before upload
3. **CDN** - Use Railway CDN for static assets
4. **Caching** - SWR handles HTTP cache automatically
5. **Socket.io Optimization** - Already using native transports

---

## Security Features

✅ Password hashing (bcryptjs)  
✅ JWT authentication  
✅ HTTPS enforced  
✅ CORS protection  
✅ SQL injection prevention (MongoDB + Mongoose)  
✅ XSS protection (React + sanitization)  
✅ CSRF tokens (via credentials)  
✅ Rate limiting ready  
✅ Security headers (Helmet.js)  
✅ Input validation  

---

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push branch: `git push origin feature/YourFeature`
5. Open pull request

---

## License

MIT License - Free to use for personal and commercial projects

---

## Support & Resources

- **Deployment:** [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Troubleshooting:** [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md)
- **Railway Docs:** https://railway.app/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Express Docs:** https://expressjs.com
- **MongoDB Docs:** https://docs.mongodb.com
- **Socket.io Docs:** https://socket.io/docs

---

## Roadmap

Future features in development:
- [ ] Stories feature (Instagram-like)
- [ ] Hashtag system
- [ ] Location tagging
- [ ] User mentions
- [ ] Video filters & effects
- [ ] Reels algorithm (explore page)
- [ ] Payment integration
- [ ] Creator monetization
- [ ] Analytics dashboard
- [ ] Mobile native apps

---

**Happy coding! 🎉 Your social media platform is ready to conquer the world!**

- Do not deploy the local MongoDB files in `server/local-mongo-data`; they are ignored for future deploys.
- For real traffic, use Railway's MongoDB service or MongoDB Atlas instead of the local XAMPP MongoDB database.
- Keep `JWT_SECRET` the same across backend redeploys so existing logins stay valid.
=======
# Youtogram-webapp
social media web application
>>>>>>> 4dfcafd04cf691bc207ad6d8233055472180746b
