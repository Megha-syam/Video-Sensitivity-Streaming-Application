# 🚀 VideoConnect+ Deployment Guide

## Architecture Overview

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Vercel    │ ───> │   Render    │ ───> │ MongoDB      │
│  (Frontend) │      │  (Backend)  │      │   Atlas      │
└─────────────┘      └─────────────┘      └──────────────┘
```

---

## 📝 Prerequisites

1. GitHub account
2. Vercel account (free)
3. Render account (free)
4. MongoDB Atlas account (free)
5. Cloudinary account (free) - for video storage

---

## Part 1: MongoDB Atlas Setup

### 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up / Log in
3. Create a **FREE** M0 cluster
4. Choose **AWS** provider, closest region to you

### 2. Configure Network Access

1. Go to **Network Access** tab
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (0.0.0.0/0)
4. Click **Confirm**

### 3. Create Database User

1. Go to **Database Access** tab
2. Click **Add New Database User**
3. Username: `videoconnect_user`
4. Password: Generate a strong password (save it!)
5. **Database User Privileges:** Read and write to any database
6. Click **Add User**

### 4. Get Connection String

1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Copy the connection string:
   ```
   mongodb+srv://videoconnect_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add database name: `video_sensitivity_app`
   ```
   mongodb+srv://videoconnect_user:PASSWORD@cluster0.xxxxx.mongodb.net/video_sensitivity_app?retryWrites=true&w=majority
   ```

---

## Part 2: Backend Deployment (Render)

### 1. Prepare Backend for Deployment

Create `backend/render.yaml`:

```yaml
services:
  - type: web
    name: videoconnect-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://your-frontend.vercel.app
```

### 2. Update package.json

Ensure these scripts exist:

```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### 3. Deploy to Render

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **New +** → **Web Service**
4. Connect your GitHub repository
5. Settings:
   - **Name:** videoconnect-backend
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
   - **Instance Type:** Free

6. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Random 64-character string
   - `FRONTEND_URL`: `https://your-app.vercel.app` (update after frontend deploy)
   - `PORT`: 10000 (automatic on Render)

7. Click **Create Web Service**

8. **Note the URL:** `https://videoconnect-backend.onrender.com`

---

## Part 3: File Storage (Cloudinary)

### 1. Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free
3. Go to **Dashboard**
4. Note these values:
   - Cloud Name
   - API Key
   - API Secret

### 2. Install Cloudinary in Backend

```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

### 3. Update Video Upload to Use Cloudinary

Create `backend/src/config/cloudinary.config.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

Update `backend/src/routes/video.routes.ts` to use Cloudinary storage instead of local disk.

---

## Part 4: Frontend Deployment (Vercel)

### 1. Update Frontend Environment Variables

Create `frontend/.env.production`:

```env
VITE_API_URL=https://videoconnect-backend.onrender.com/api
VITE_SOCKET_URL=https://videoconnect-backend.onrender.com
```

### 2. Update CORS in Backend

Update `backend/src/server.ts`:

```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));
```

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

#### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Add Environment Variables:
   - `VITE_API_URL`: `https://videoconnect-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://videoconnect-backend.onrender.com`

6. Click **Deploy**

7. **Note the URL:** `https://your-app.vercel.app`

### 4. Update Backend FRONTEND_URL

Go back to Render dashboard and update `FRONTEND_URL` environment variable with your Vercel URL.

---

## Part 5: Seed Database

```bash
# SSH into Render or run locally with production MongoDB URI
export MONGODB_URI="your-atlas-connection-string"
npm run seed
```

---

## ✅ Deployment Checklist

### Backend (Render)
- [ ] Code pushed to GitHub
- [ ] Render service created
- [ ] Environment variables set
- [ ] Build successful
- [ ] Service running (green status)
- [ ] API accessible at `/api/health`

### Database (MongoDB Atlas)
- [ ] Cluster created
- [ ] User created
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Connection string obtained
- [ ] Database seeded

### Frontend (Vercel)
- [ ] Deployed successfully
- [ ] Environment variables set
- [ ] Can access the site
- [ ] API calls working (check Network tab)

### Testing
- [ ] Can register new user
- [ ] Can login
- [ ] Can upload video (to Cloudinary)
- [ ] Socket.IO connection works
- [ ] Videos appear in library
- [ ] Can play videos

---

## 🐛 Common Issues

### Issue: "Failed to fetch" errors

**Solution:** Check CORS settings and FRONTEND_URL in backend

### Issue: Socket.IO not connecting

**Solution:** Ensure VITE_SOCKET_URL is correct and backend allows WebSocket connections

### Issue: Video upload fails

**Solution:** Check Cloudinary credentials and multer configuration

### Issue: MongoDB connection failed

**Solution:** Verify IP whitelist includes 0.0.0.0/0 and connection string is correct

---

## 📊 Free Tier Limits

| Service | Free Tier Limit |
|---------|----------------|
| **Vercel** | 100 GB bandwidth/month |
| **Render** | 750 hours/month (always-on) |
| **MongoDB Atlas** | 512 MB storage |
| **Cloudinary** | 25 GB storage, 25 GB bandwidth |

---

## 🔒 Security Checklist

- [ ] JWT_SECRET is random and secure
- [ ] MongoDB credentials are not in code
- [ ] CORS is properly configured
- [ ] Environment variables are set (not hardcoded)
- [ ] Google credentials file is in .gitignore
- [ ] .env files are in .gitignore

---

## 📝 Post-Deployment

### Update README.md

```markdown
## Live Demo

🌐 **Frontend:** https://your-app.vercel.app
🔧 **Backend API:** https://videoconnect-backend.onrender.com
```

### Test Everything

1. Register a new account
2. Upload a video
3. Check library
4. Create a group
5. Share a video with group
6. Test video player with RBAC

---

## 💡 Production Tips

1. **Monitoring:** Set up Render alerts and Vercel analytics
2. **Logs:** Check Render logs for backend errors
3. **Database:** Regular backups of MongoDB
4. **Performance:** Use Vercel Edge Network for fast global access
5. **Costs:** Monitor usage to stay within free tiers

---

## Need Help?

- Render Logs: `https://dashboard.render.com/`
- Vercel Logs: Build → Deployments → Logs
- MongoDB Logs: Atlas → Cluster → Metrics

Good luck with deployment! 🚀
