# File Upload Strategy - Critical for Launch

## The Problem

If your backend handles file uploads:

```javascript
app.post('/upload', (req, res) => {
  const file = req.files.video;
  file.mv('./uploads/video.mp4');
  res.json({ url: '/uploads/video.mp4' });
});
```

**What breaks:**
- Railway storage limit hit in days
- Large uploads block entire API
- Multiple uploads = slow everything
- No security (virus uploads, etc)
- Impossible to scale

**What happens:**
- User uploads 100MB video
- API blocks for 30 seconds
- 100 other users get timeout
- Your app feels "broken"

---

## The Right Way: Client-Side Upload with S3/R2

### Architecture

```
User picks file
    ↓
Frontend requests upload URL from backend
    ↓
Backend returns signed URL (time-limited)
    ↓
Frontend uploads directly to S3/R2 (bypasses API)
    ↓
Frontend sends metadata to backend
    ↓
Backend saves metadata only
```

**Why this works:**
- Your API never touches the file
- Upload happens in parallel
- Users upload files simultaneously
- Automatic CDN delivery from S3/R2
- Scales infinitely

---

## Implementation (Choose One)

### Option 1: Cloudflare R2 (CHEAPEST)
- $15/month includes 10GB storage
- 1M requests free
- Best for bootstraps

### Option 2: AWS S3 (MOST POPULAR)
- Pay per GB stored
- Pay per request
- Industry standard
- Slightly more expensive

**I'll show both. Start with R2 if budget is tight.**

---

## Setup: Cloudflare R2

### Step 1: Create R2 Bucket

1. Go to Cloudflare Dashboard
2. R2 → Create Bucket
3. Name: `youtogram-media`
4. Keep private

### Step 2: Create API Token

1. Account Settings → API Tokens
2. Create → Edit Cloudflare R2
3. Save:
   - Account ID
   - Access Key ID
   - Secret Access Key

### Step 3: Add to Backend Environment

```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=youtogram-media
R2_PUBLIC_URL=https://cdn.example.com  # R2 domain
```

---

## Backend Implementation

### Install Packages

```bash
npm install aws-sdk uuid
```

### Create Upload Service

Create `server/src/services/uploadService.js`:

```javascript
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3Client = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'auto'
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

exports.getUploadUrl = async (userId, fileType, fileSize) => {
  // Validate file
  if (!isValidFileType(fileType)) {
    const error = new Error('File type not allowed');
    error.status = 400;
    throw error;
  }

  if (fileSize > 500 * 1024 * 1024) { // 500MB limit
    const error = new Error('File too large');
    error.status = 400;
    throw error;
  }

  // Generate unique filename
  const fileId = uuidv4();
  const ext = getFileExtension(fileType);
  const key = `user-${userId}/${Date.now()}-${fileId}.${ext}`;

  // Create signed URL (valid for 30 minutes)
  const signedUrl = await s3Client.getSignedUrlPromise('putObject', {
    Bucket: BUCKET,
    Key: key,
    ContentType: fileType,
    Expires: 30 * 60, // 30 minutes
    Metadata: {
      'user-id': userId,
      'upload-time': new Date().toISOString()
    }
  });

  return {
    uploadUrl: signedUrl,
    fileId: key,
    publicUrl: `${PUBLIC_URL}/${key}`,
    expiresIn: 1800
  };
};

exports.getPublicUrl = (fileId) => {
  return `${PUBLIC_URL}/${fileId}`;
};

const isValidFileType = (type) => {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
  ];
  return allowed.includes(type);
};

const getFileExtension = (mimeType) => {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi'
  };
  return map[mimeType] || 'bin';
};
```

### Create Upload Controller

Create `server/src/controllers/uploadController.js`:

```javascript
const uploadService = require('../services/uploadService');

exports.getUploadUrl = async (req, res, next) => {
  try {
    const { fileType, fileSize } = req.body;

    if (!fileType || !fileSize) {
      return res.status(400).json({
        status: 'error',
        message: 'fileType and fileSize required'
      });
    }

    const uploadInfo = await uploadService.getUploadUrl(
      req.user.id,
      fileType,
      fileSize
    );

    res.json({
      status: 'success',
      data: uploadInfo
    });
  } catch (error) {
    next(error);
  }
};
```

### Add Upload Routes

Update `server/src/routes/uploads.js`:

```javascript
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const uploadController = require('../controllers/uploadController');

router.post('/request-url', authMiddleware, uploadController.getUploadUrl);

module.exports = router;
```

### Register Routes in app.js

```javascript
const uploadRoutes = require('./routes/uploads');

app.use('/api/uploads', uploadRoutes);
```

---

## Frontend Implementation

### Create Upload Hook

Create `client/hooks/useUpload.js`:

```javascript
import { useState } from 'react';
import { fetcher } from '../services/api';

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const uploadFile = async (file) => {
    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // Step 1: Get signed upload URL from backend
      const uploadResponse = await fetcher('/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: file.type,
          fileSize: file.size
        })
      });

      const { uploadUrl, publicUrl } = uploadResponse.data;

      // Step 2: Upload directly to S3/R2
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploading(false);
          setProgress(100);
          return publicUrl;
        } else {
          throw new Error('Upload failed');
        }
      });

      xhr.addEventListener('error', () => {
        setError('Upload failed');
        setUploading(false);
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

      return publicUrl;
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      throw err;
    }
  };

  return { uploadFile, uploading, progress, error };
};
```

### Use in Component

```javascript
import { useUpload } from '../hooks/useUpload';

export default function PostCreator() {
  const { uploadFile, uploading, progress } = useUpload();
  const [mediaUrl, setMediaUrl] = useState('');

  const handleFileSelect = async (file) => {
    try {
      const url = await uploadFile(file);
      setMediaUrl(url);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => handleFileSelect(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <progress value={progress} max="100" />}
      {mediaUrl && <img src={mediaUrl} alt="Uploaded" />}
    </div>
  );
}
```

---

## Testing

### Test Upload Locally

```bash
# Start backend
npm run dev

# Test endpoint
curl -X POST http://localhost:5000/api/uploads/request-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileType":"image/jpeg","fileSize":1000000}'

# Should return signed URL
```

### Test End-to-End

1. Create post with image
2. Select image file
3. Watch progress bar
4. Should complete in <5 seconds
5. Image appears in feed from R2/S3 URL

---

## Cost Analysis (Monthly)

### Cloudflare R2
- Storage: $15/month (up to 10GB, then $0.015/GB)
- Requests: Free (1M), then $0.36/million
- **For 1000 users with light uploads: ~$15/month**

### AWS S3
- Storage: $0.023/GB/month
- Requests: $0.0007/1000
- **For 1000 users with light uploads: ~$20-30/month**

---

## Security Checklist

✅ File type validation (backend)  
✅ File size limits (backend)  
✅ Signed URLs with expiration  
✅ User ID in file path  
✅ No direct access to upload URL  
✅ Virus scanning (optional, paid service)  

---

## What You Get

✅ Scalable file storage  
✅ API never touched by file data  
✅ CDN delivery (fast worldwide)  
✅ Automatic backups  
✅ Low cost  
✅ Supports any file type  
✅ Easy to add validation layer  

---

## Implementation Timeline

- Setup R2/S3: 15 minutes
- Backend changes: 30 minutes
- Frontend changes: 30 minutes
- Testing: 15 minutes
- **Total: ~1.5 hours**

**Do this BEFORE launch.**

If you launch without this, you'll run out of Railway storage in days and delete user uploads to make space. Don't do that.

---

## Next Steps

1. Choose R2 or S3
2. Set up credentials
3. Implement upload service
4. Test file uploads
5. Update video/image post creation
6. Deploy

This is critical. Don't skip.
