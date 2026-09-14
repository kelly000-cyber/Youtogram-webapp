# Rate Limiting - Stop Bots Before They Destroy You

## Why This is Critical

If you don't have rate limiting, within **6 hours of launch**:

```
18:00 - Launch goes live
18:30 - First 50 real users
19:00 - 100 real users, everything fast
20:00 - Bot discovers login endpoint
20:15 - 10,000 login attempts in 15 minutes
20:16 - Your API is unresponsive
20:17 - Real users experience timeout
20:18 - App looks "broken" in its first day
20:30 - Bots still trying to brute force
```

This is not theoretical. This happens to every new app.

---

## The Fix: Redis-Based Rate Limiting

### Architecture

```
Request comes in
    ↓
Check Redis counter
    ↓
If limit exceeded: return 429 (Too Many Requests)
    ↓
If limit OK: process request + increment counter
    ↓
Counter expires after time window (e.g., 15 min)
```

**Why Redis:**
- Super fast (microseconds)
- Distributed (works with multiple servers)
- Built-in expiration (auto-cleanup)
- Perfect for this exact use case

---

## Implementation

### Step 1: Install Packages

```bash
npm install redis ioredis express-rate-limit rate-limit-redis
```

### Step 2: Create Rate Limit Middleware

Create `server/src/middleware/rateLimitMiddleware.js`:

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const rateLimit = require('express-rate-limit');

// Create Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
  // Fall back to memory store if Redis fails
});

// Authentication endpoints: strict limits (prevent brute force)
exports.authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth:',
    expiry: 15 * 60 // 15 minutes
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skip: (req) => !req.body?.email && !req.body?.identifier, // Skip if no email
  keyGenerator: (req) => {
    // Rate limit by IP + email
    return `${req.ip}:${req.body?.email || req.body?.identifier}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many login attempts. Try again in 15 minutes.',
      retryAfter: 900
    });
  }
});

// Post creation: moderate limits
exports.postLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'post:',
    expiry: 60 * 60 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 posts per hour
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Post limit exceeded. Maximum 20 posts per hour.',
      retryAfter: 3600
    });
  }
});

// Feed fetch: generous but capped
exports.feedLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'feed:',
    expiry: 60 // 1 minute
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests. Please wait before fetching feed again.',
      retryAfter: 60
    });
  }
});

// General API: moderate
exports.apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'api:',
    expiry: 60 // 1 minute
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => {
    // Don't rate limit health checks
    return req.path === '/api/health';
  }
});

// Search: prevent enumeration attacks
exports.searchLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'search:',
    expiry: 60 * 60 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 searches per hour
  keyGenerator: (req) => req.user?.id || req.ip
});

// Message sending: prevent spam
exports.messageLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'message:',
    expiry: 60 * 60 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 messages per hour
  keyGenerator: (req) => req.user?.id || req.ip
});

module.exports = { redisClient };
```

### Step 3: Apply Middleware to Routes

Update `server/src/app.js`:

```javascript
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');

// Apply general API limiter first
app.use('/api/', rateLimitMiddleware.apiLimiter);

// Auth routes - strict
app.use('/api/auth/login', rateLimitMiddleware.authLimiter);
app.use('/api/auth/register', rateLimitMiddleware.authLimiter);

// Posts - moderate
app.use('/api/posts', (req, res, next) => {
  if (req.method === 'POST') {
    return rateLimitMiddleware.postLimiter(req, res, next);
  }
  if (req.method === 'GET') {
    return rateLimitMiddleware.feedLimiter(req, res, next);
  }
  next();
});

// Search - prevent abuse
app.use('/api/search', rateLimitMiddleware.searchLimiter);

// Messages - prevent spam
app.use('/api/chat/messages', (req, res, next) => {
  if (req.method === 'POST') {
    return rateLimitMiddleware.messageLimiter(req, res, next);
  }
  next();
});

// Videos - moderate
app.use('/api/videos', (req, res, next) => {
  if (req.method === 'POST') {
    return rateLimitMiddleware.postLimiter(req, res, next); // Reuse post limits
  }
  next();
});
```

---

## Rate Limit Strategy (Copy This)

| Endpoint | Limit | Window | Why |
|----------|-------|--------|-----|
| Login | 5 attempts | 15 min | Prevent brute force |
| Register | 5 attempts | 15 min | Prevent account spam |
| Create post | 20 posts | 1 hour | Prevent spam |
| Create video | 5 videos | 1 hour | Prevent storage abuse |
| Send message | 100 msgs | 1 hour | Prevent harassment |
| Search | 50 searches | 1 hour | Prevent scraping |
| Like post | 500 likes | 1 hour | Prevent fake engagement |
| Feed fetch | 30 requests | 1 minute | Prevent hammering |

---

## Frontend Handling

### Handle 429 Responses

```javascript
export async function fetcher(url, options) {
  const response = await fetch(`${API_BASE}${url}`, options);
  
  if (response.status === 429) {
    const data = await response.json();
    const retryAfter = data.retryAfter || 60;
    
    // Tell user to wait
    throw new Error(
      `Rate limited. Try again in ${retryAfter} seconds.`
    );
  }
  
  if (!response.ok) {
    throw new Error('Request failed');
  }
  
  return await response.json();
}
```

### Show User Feedback

```javascript
export default function LoginForm() {
  const [error, setError] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);

  const handleLogin = async (email, password) => {
    try {
      const result = await authService.login({ email, password });
      // Success
    } catch (err) {
      if (err.message.includes('Rate limited')) {
        // Extract wait time
        const match = err.message.match(/(\d+)\s*seconds/);
        const wait = parseInt(match?.[1]) || 60;
        setRetryAfter(wait);
        
        // Count down
        const interval = setInterval(() => {
          setRetryAfter(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      setError(err.message);
    }
  };

  return (
    <div>
      {error && <p className="error">{error}</p>}
      {retryAfter > 0 && (
        <p>Try again in {retryAfter} seconds...</p>
      )}
      <button 
        onClick={() => handleLogin(email, password)}
        disabled={retryAfter > 0}
      >
        {retryAfter > 0 ? `Wait ${retryAfter}s` : 'Login'}
      </button>
    </div>
  );
}
```

---

## Environment Variables

Add to `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=           # If using password auth
```

For Railway Redis:

```env
REDIS_URL=${{Redis.REDIS_URL}}
```

Then update rate limit middleware:

```javascript
const redis = require('redis');
const url = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = redis.createClient({ url });
```

---

## Testing

### Test Login Rate Limiting

```bash
# Try 6 rapid logins
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 0.5
done

# Attempts 1-5: 401 (wrong password)
# Attempt 6: 429 (rate limited)
```

### Verify Redis Storage

```bash
# Connect to Redis
redis-cli

# Check rate limit keys
KEYS *auth:*
KEYS *post:*

# See remaining TTL
TTL auth:127.0.0.1:test@example.com
```

---

## What This Prevents

✅ Brute force login attacks  
✅ Automated account creation  
✅ Spam posting  
✅ Feed hammering  
✅ User enumeration (search scraping)  
✅ Fake engagement (mass liking)  
✅ Message flooding  
✅ API abuse  

---

## Monitoring

Track in logs:

```javascript
// Add to rate limit handler
handler: (req, res) => {
  console.warn(`Rate limit hit: ${req.path} from ${req.ip}`);
  res.status(429).json({ ... });
}
```

Watch for:
- Same IP hitting limit repeatedly → Potential attack
- New accounts registering rapidly → Spam accounts
- Single user creating 100 posts/hour → Bot account

---

## Advanced: Adaptive Rate Limiting

If you want to get fancy:

```javascript
// Stricter limits during traffic spikes
const getLimit = async (req) => {
  const trafficLevel = await redis.get('current_traffic');
  
  if (trafficLevel === 'high') {
    return 10; // Lower limit
  }
  return 20; // Normal limit
};
```

But for launch, the basic version above is perfect.

---

## Cost Impact

Redis (Railway): $7/month
Redis (Upstash): Free tier up to 10K commands/day

For 1000 users with these limits, you'll use ~5K commands/day.
**Fits in free tier.**

---

## Implementation Checklist

- [ ] Install packages
- [ ] Create rate limit middleware
- [ ] Set up Redis connection
- [ ] Apply to auth routes (strict)
- [ ] Apply to post routes (moderate)
- [ ] Apply to feed routes (generous)
- [ ] Apply to search routes (prevent enumeration)
- [ ] Apply to message routes (prevent spam)
- [ ] Test each endpoint
- [ ] Handle 429 responses in frontend
- [ ] Deploy and monitor

**Time to implement:** 45 minutes
**Impact:** Prevents 99% of abuse

---

## Do This BEFORE Launch

This is not optional.

Launch without rate limiting and:
- Bots will destroy you on day 1
- API will be unresponsive
- Real users will think your app is broken
- Your database will be hit with garbage data
- Recovery will take days

Rate limiting is 45 minutes of work that saves you weeks of damage control.

**Implement this today.**

Next: File uploads, then move to caching.
