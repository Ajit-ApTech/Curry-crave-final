# 🚀 Curry Crave Deployment Guide

This guide will help you deploy your Curry Crave website:
- **Backend** → Render.com (Free Node.js hosting)
- **Frontend** → InfinityFree (Free static hosting)

---

## 📋 Pre-Deployment Checklist

Your project has been cleaned up:
- ✅ Removed `node_modules` (will be reinstalled by Render)
- ✅ Removed `.git` folders
- ✅ Removed `.DS_Store` files
- ✅ Removed duplicate images
- ✅ Removed documentation and test files
- ✅ Updated API URLs for production

**File counts:**
- Total: 84 files
- Frontend: 46 files
- Backend: 37 files

---

## 🖥️ STEP 1: Deploy Backend to Render.com

### 1.1 Create GitHub Repository for Backend

First, push your backend code to GitHub:

```bash
cd /Users/ajitprajapati/project1f/Backend/curry-crave-backend

# Initialize git
git init
git add .
git commit -m "Initial commit - Curry Crave Backend"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/curry-crave-backend.git
git branch -M main
git push -u origin main
```

### 1.2 Deploy on Render

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select `curry-crave-backend` repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `curry-crave-backend` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | (leave empty) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### 1.3 Add Environment Variables

In Render dashboard, go to **Environment** and add these variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `your-mongodb-atlas-connection-string` |
| `JWT_SECRET` | `your-secure-random-string` |
| `FRONTEND_URL` | `https://your-infinityfree-domain.com` |

### 1.4 Get Your Render URL

After deployment, Render will give you a URL like:
```
https://curry-crave-backend.onrender.com
```

**⚠️ IMPORTANT: Copy this URL - you'll need it for Step 2!**

---

## 🌐 STEP 2: Update Frontend API URL

Before uploading to InfinityFree, update the API URL in your frontend files.

### 2.1 Update api.js

Open `/Users/ajitprajapati/project1f/curry-crave-website/js/api.js`

Change line 8 from:
```javascript
const PRODUCTION_URL = 'https://YOUR-RENDER-APP-NAME.onrender.com/api';
```

To your actual Render URL:
```javascript
const PRODUCTION_URL = 'https://curry-crave-backend.onrender.com/api';
```

### 2.2 Update admin.js

Open `/Users/ajitprajapati/project1f/curry-crave-website/js/admin.js`

Change line 8 from:
```javascript
const PRODUCTION_API_URL = 'https://YOUR-RENDER-APP-NAME.onrender.com/api';
```

To your actual Render URL:
```javascript
const PRODUCTION_API_URL = 'https://curry-crave-backend.onrender.com/api';
```

---

## 📤 STEP 3: Deploy Frontend to InfinityFree

### 3.1 Prepare Files

Create a ZIP file of your frontend:

```bash
cd /Users/ajitprajapati/project1f/curry-crave-website
zip -r ../curry-crave-frontend.zip .
```

This creates `curry-crave-frontend.zip` in the project1f folder.

### 3.2 Upload to InfinityFree

1. Login to InfinityFree Control Panel
2. Go to **File Manager**
3. Navigate to **`htdocs`** folder (IMPORTANT!)
4. Delete any existing files in htdocs (like `index2.html`)
5. Click **"Upload"** → Select **"Zip & Extract"**
6. Upload `curry-crave-frontend.zip`
7. Wait for extraction to complete

### 3.3 Verify Upload

After upload, your htdocs folder should contain:
```
htdocs/
├── index.html
├── admin.html
├── css/
├── js/
├── assets/
└── ...
```

---

## 🔧 STEP 4: Configure CORS on Render

Go back to Render dashboard and add your InfinityFree domain to environment variables:

| Variable | Value |
|----------|-------|
| `CORS_ORIGINS` | `https://your-site.infinityfreeapp.com,https://www.your-site.infinityfreeapp.com` |

Redeploy after adding this variable.

---

## ✅ STEP 5: Test Your Deployment

1. **Test Backend API:**
   - Visit `https://curry-crave-backend.onrender.com`
   - You should see: `{"success": true, "message": "Curry Crave API is running!"}`

2. **Test Frontend:**
   - Visit your InfinityFree URL
   - Menu items should load from the API
   - Login should work

3. **Test Admin Panel:**
   - Visit `https://your-site.infinityfreeapp.com/admin.html`
   - Login with admin credentials

---

## � Troubleshooting

### Backend Issues

**Problem:** API returns 503 error
- **Solution:** Render free tier sleeps after 15 mins of inactivity. First request wakes it up (takes ~30 seconds).

**Problem:** MongoDB connection fails
- **Solution:** Make sure your MongoDB Atlas IP whitelist includes `0.0.0.0/0` (allow all) for Render.

### Frontend Issues

**Problem:** CORS errors in browser console
- **Solution:** Add your InfinityFree domain to `CORS_ORIGINS` environment variable on Render.

**Problem:** API calls fail
- **Solution:** Check that you updated the PRODUCTION_URL in api.js and admin.js correctly.

### InfinityFree Issues

**Problem:** "Directory creation only allowed in htdocs"
- **Solution:** Make sure you navigate into htdocs folder BEFORE uploading.

---

## � Quick Reference

| Component | URL |
|-----------|-----|
| Backend API | `https://YOUR-RENDER-APP.onrender.com` |
| Frontend Website | `https://YOUR-SITE.infinityfreeapp.com` |
| Admin Panel | `https://YOUR-SITE.infinityfreeapp.com/admin.html` |

| Credentials | Value |
|-------------|-------|
| Demo User | `demo@currycrave.com` / `demo123` |
| Demo Admin | `admin@currycrave.com` / `admin123` |

---

## � Done!

Your Curry Crave website is now live! 🍛

Remember:
- Render free tier may have cold starts (30 sec delay after inactivity)
- Always update CORS settings when changing domains
- Keep your MongoDB Atlas credentials secure
