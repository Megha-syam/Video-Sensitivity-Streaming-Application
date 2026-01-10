# 🚀 Complete Step-by-Step Deployment Guide
## VideoConnect+ → Render + Vercel

**Total Time:** ~60 minutes  
**Cost:** 100% FREE

---

## 📋 Pre-Deployment Checklist

Before starting, ensure you have:
- [ ] GitHub account
- [ ] Git installed on your computer
- [ ] Code pushed to GitHub repository
- [ ] Email address for signups

---

# PHASE 1: Setup Services (20 minutes)

## Step 1: Create MongoDB Atlas Account (Free Database)

### 1.1 Sign Up
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Click **"Sign up"**
3. Use your email or Google account
4. Verify your email

### 1.2 Create Cluster
1. After login, you'll see "Deploy a cloud database"
2. Click **"Create"** on the FREE tier (M0)
3. Choose these settings:
   - **Provider:** AWS
   - **Region:** Choose closest to you (e.g., Mumbai for India)
   - **Cluster Name:** Keep default or name it `VideoConnect`
4. Click **"Create Cluster"** (takes 3-5 minutes)

### 1.3 Create Database User
1. Wait for cluster to finish creating
2. Click **"Database Access"** in left sidebar
3. Click **"Add New Database User"**
   - **Authentication Method:** Password
   - **Username:** `videoconnect_admin`
   - **Password:** Click "Autogenerate Secure Password" and **COPY IT!**
   - **Database User Privileges:** Atlas admin
4. Click **"Add User"**

### 1.4 Allow Network Access
1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds 0.0.0.0/0)
4. Click **"Confirm"**

### 1.5 Get Connection String
1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://videoconnect_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **IMPORTANT:** Replace `<password>` with the password you copied earlier
6. Add database name at the end:
   ```
   mongodb+srv://videoconnect_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/video_sensitivity_app?retryWrites=true&w=majority
   ```
7. **Save this string** - you'll need it later!

---

## Step 2: Create Cloudinary Account (Free Video Storage)

### 2.1 Sign Up
1. Go to: https://cloudinary.com/users/register/free
2. Sign up with email
3. Verify your email

### 2.2 Get Credentials
1. After login, go to **Dashboard**
2. You'll see:
   - **Cloud Name:** (e.g., `dxxxxxxx`)
   - **API Key:** (e.g., `123456789012345`)
   - **API Secret:** Click "👁️ Show" to reveal
3. **Save these three values** - you'll need them!

---

## Step 3: Create Render Account (Free Backend Hosting)

1. Go to: https://render.com/
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (easiest for deployment)
4. Authorize Render to access your GitHub

---

## Step 4: Create Vercel Account (Free Frontend Hosting)

1. Go to: https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub

---

# PHASE 2: Prepare Code for Deployment (15 minutes)

## Step 5: Push Code to GitHub

### 5.1 Create GitHub Repository
1. Go to: https://github.com/new
2. Repository name: `videoconnect-plus`
3. **Keep it Public** (required for free Render)
4. **Don't** initialize with README (you already have code)
5. Click **"Create repository"**

### 5.2 Push Your Code
Open terminal in your project root:

```powershell
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for deployment"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/videoconnect-plus.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Verify:** Go to your GitHub repo URL and confirm files are there

---

## Step 6: Update Backend Configuration

### 6.1 Update package.json
Edit `backend/package.json` - ensure these scripts exist:

```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js",
    "seed": "ts-node seed.ts"
  }
}
```

### 6.2 Update CORS Configuration  
Edit `backend/src/server.ts` around line 20:

```typescript
// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));
```

### 6.3 Update Socket.IO Configuration
In `backend/src/server.ts` around line 30:

```typescript
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});
```

---

## Step 7: Configure Cloudinary (Video Storage)

### 7.1 Install Cloudinary
```powershell
cd backend
npm install cloudinary multer-storage-cloudinary
```

### 7.2 Create Cloudinary Config
Create `backend/src/config/cloudinary.config.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'videoconnect',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
  } as any,
});

export default cloudinary;
```

### 7.3 Update Video Routes
Edit `backend/src/routes/video.routes.ts`:

**Replace this:**
```typescript
import multer from 'multer';

const storage = multer.diskStorage({
  destination: './uploads/videos',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
```

**With this:**
```typescript
import multer from 'multer';
import { storage } from '../config/cloudinary.config';

const upload = multer({ storage });
```

---

## Step 8: Update Frontend Configuration

### 8.1 Install Vercel CLI (Optional but recommended)
```powershell
npm install -g vercel
```

### 8.2 Update Environment Variables
The frontend will use Vercel's environment variables (we'll set them later in Vercel dashboard)

---

## Step 9: Commit Changes to GitHub

```powershell
# Add all changes
git add .

# Commit
git commit -m "Configure for production deployment"

# Push
git push origin main
```

---

# PHASE 3: Deploy Backend to Render (10 minutes)

## Step 10: Deploy Backend

### 10.1 Create Web Service
1. Go to: https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select your `videoconnect-plus` repository
5. Click **"Connect"**

### 10.2 Configure Service
Fill in these settings:

**Basic Settings:**
- **Name:** `videoconnect-backend`
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Instance Type:**
- Select **"Free"** (should be selected by default)

### 10.3 Add Environment Variables
Scroll down to **"Environment Variables"** section and click **"Add Environment Variable"**

Add these **7 variables** one by one:

| Key | Value |
|-----|-------|
| `PORT` | `10000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Generate random 64-char string* |
| `FRONTEND_URL` | `https://will-update-later.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

*For JWT_SECRET, use this PowerShell command:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### 10.4 Deploy
1. Click **"Create Web Service"** at the bottom
2. Wait for deployment (5-10 minutes first time)
3. Watch the logs - should say "Deploy succeeded"

### 10.5 Get Backend URL
1. At the top of the page, you'll see your URL:
   ```
   https://videoconnect-backend.onrender.com
   ```
2. **COPY THIS URL** - you'll need it for frontend!

### 10.6 Test Backend
Open in browser:
```
https://videoconnect-backend.onrender.com/api/users/organizations
```

Should return: `{"organizations":[]}`

✅ If you see this, backend is working!

---

# PHASE 4: Deploy Frontend to Vercel (10 minutes)

## Step 11: Deploy Frontend

### Method A: Using Vercel Dashboard (Easier)

#### 11.1 Import Project
1. Go to: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Find and select `videoconnect-plus`
4. Click **"Import"**

#### 11.2 Configure Project
- **Framework Preset:** Vite (should auto-detect)
- **Root Directory:** Click **"Edit"** → Type `frontend` → Click checkmark
- **Build Command:** `npm run build` (should be auto-filled)
- **Output Directory:** `dist` (should be auto-filled)

#### 11.3 Add Environment Variables
Click **"Environment Variables"** to expand

Add these **2 variables**:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://videoconnect-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://videoconnect-backend.onrender.com` |

**Replace** `videoconnect-backend` with YOUR actual Render URL!

#### 11.4 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll see "Congratulations!" when done

#### 11.5 Get Frontend URL
Your site will be at:
```
https://videoconnect-plus-xxxxxxx.vercel.app
```

**COPY THIS URL!**

---

### Method B: Using CLI (Alternative)

```powershell
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? N
# - Project name: videoconnect-plus
# - Directory: ./
# - Override settings? N

# Deploy to production
vercel --prod
```

---

## Step 12: Update Backend with Frontend URL

### 12.1 Update Render Environment Variable
1. Go back to Render dashboard
2. Click on your `videoconnect-backend` service
3. Click **"Environment"** in left sidebar
4. Find `FRONTEND_URL`
5. Click Edit (pencil icon)
6. Update value to your Vercel URL:
   ```
   https://your-app.vercel.app
   ```
7. Click **"Save Changes"**

### 12.2 Trigger Redeploy
1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait for redeploy (~2 minutes)

---

# PHASE 5: Seed Database (5 minutes)

## Step 13: Add Sample Data

### 13.1 Using Render Shell
1. In Render dashboard, click your backend service
2. Click **"Shell"** tab at the top
3. Wait for shell to connect
4. Run:
```bash
npm run seed
```

### 13.2 Verify
Should see:
```
✅ MongoDB connected
✅ Created organizations
✅ Created users
✅ Created groups
Database seeded successfully!
```

---

# PHASE 6: Test Deployment (5 minutes)

## Step 14: Complete Testing

### 14.1 Access Your App
Open your Vercel URL in browser:
```
https://your-app.vercel.app
```

### 14.2 Test Checklist

**Registration & Login:**
- [ ] Click "Register"
- [ ] Create a new account
- [ ] Verify you're redirected to dashboard
- [ ] Log out
- [ ] Log back in

**Video Upload:**
- [ ] Click "Upload Video"
- [ ] Select a small video file (use test video < 10MB)
- [ ] Fill in title and description
- [ ] Click "Upload Video"
- [ ] See progress bar reaching 100%
- [ ] See "Processing..." then "Safe" status

**Library:**
- [ ] Click "Library"
- [ ] See your uploaded video
- [ ] Click on video card
- [ ] Video should play

**Groups:**
- [ ] Click "Groups"
- [ ] Create a new group
- [ ] Add members
- [ ] Edit group (as member)

**Settings:**
- [ ] Click "Settings"
- [ ] Update profile
- [ ] See changes saved

---

## Step 15: Configure Custom Domain (Optional)

### For Vercel (Frontend)
1. In Vercel dashboard → Your project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Update DNS records as shown

### For Render (Backend)
1. In Render dashboard → Your service
2. Click **"Settings"**
3. Scroll to **"Custom Domain"**
4. Add domain and update DNS

---

# 🎉 DEPLOYMENT COMPLETE!

## Your Live URLs

✅ **Frontend:** `https://your-app.vercel.app`  
✅ **Backend API:** `https://videoconnect-backend.onrender.com`  
✅ **Database:** MongoDB Atlas  
✅ **File Storage:** Cloudinary

---

## 📝 Post-Deployment

### Update Your README.md

Add this section:

```markdown
## 🌐 Live Demo

**Application:** https://your-app.vercel.app

### Test Credentials
- Email: `test@example.com`
- Password: `password123`

## 📊 Tech Stack Deployment

- **Frontend:** Vercel (React + TypeScript + Vite)
- **Backend:** Render (Node.js + Express + Socket.IO)
- **Database:** MongoDB Atlas (Cloud)
- **File Storage:** Cloudinary (CDN)
- **Real-time:** Socket.IO for live updates
```

---

## 🐛 Troubleshooting

### Issue: Frontend can't connect to backend

**Check:**
1. VITE_API_URL is correct in Vercel environment variables
2. FRONTEND_URL is correct in Render environment variables
3. Both end with/without trailing slashes consistently

**Fix:**
- Redeploy both services after updating env vars

---

### Issue: Videos not uploading

**Check:**
1. Cloudinary credentials are correct
2. File size < 100MB
3. Check Render logs for errors

---

### Issue: Socket.IO not connecting

**Check:**
1. VITE_SOCKET_URL matches your Render URL exactly
2. No CORS errors in browser console
3. Render service is active (not sleeping)

---

### Issue: Render service sleeps after 15 min

**This is normal for free tier!**

**Solutions:**
1. Use a service like [UptimeRobot](https://uptimerobot.com/) to ping every 14 minutes
2. Upgrade to paid Render plan ($7/month for always-on)
3. Accept 30-second wake-up time on first request

---

## 💰 Staying in Free Tier

| Service | Free Limit | Your Usage | Safe? |
|---------|------------|------------|-------|
| **Render** | 750 hours/month | ~720 hours | ✅ |
| **Vercel** | 100GB bandwidth | <1GB likely | ✅ |
| **MongoDB Atlas** | 512MB storage | <50MB likely | ✅ |
| ** Cloudinary** | 25GB storage | Depends on videos | ⚠️ |

**Tips:**
- Delete test videos from Cloudinary
- Limit video uploads for demo
- Monitor Cloudinary usage weekly

---

## 🔒 Security Checklist

- [ ] JWT_SECRET is random and secure
- [ ] MongoDB password is strong
- [ ] Cloudinary API secret is not in code
- [ ] `.env` files are in `.gitignore`
- [ ] CORS is properly configured
- [ ] Only allowed IPs can access MongoDB (0.0.0.0/0 for now)

---

## 📊 Monitoring & Logs

### Render Logs
```
https://dashboard.render.com/ → Your service → Logs
```

### Vercel Logs
```
https://vercel.com/ → Your project → Deployments → Click deployment → Logs
```

### MongoDB Metrics
```
https://cloud.mongodb.com/ → Cluster → Metrics
```

---

## 🚀 Next Steps

1. **Share your live demo link!**
2. **Add to your resume/portfolio**
3. **Show it in your presentation**
4. **Monitor for any errors**

---

## Need Help?

**Common Resources:**
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com/

**Your Deployment:**
- Frontend: Vercel Dashboard
- Backend: Render Dashboard  
- Database: MongoDB Atlas Dashboard
- Files: Cloudinary Dashboard

---

**Congratulations! Your app is now live! 🎊**
