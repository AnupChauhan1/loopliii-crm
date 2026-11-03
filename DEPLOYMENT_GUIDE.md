# Loopli CRM Deployment Guide

This guide will help you deploy Loopli CRM to production using free hosting services.

## Prerequisites

- GitHub account (already have repository)
- Render.com account (free)
- Vercel account (free)
- Neon.tech account (free PostgreSQL)

## Step 1: Set up PostgreSQL Database (Neon.tech)

1. Go to https://neon.tech and sign up for a free account
2. Click "New Project"
3. Enter project name: `loopli-crm-db`
4. Choose a region (select one closest to your users)
5. Click "Create Project"
6. After creation, click "Connect" in the sidebar
7. Copy the connection string (it will look like: `postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)
8. Save this string - you'll need it for Render deployment

## Step 2: Deploy Backend API (Render.com)

1. Go to https://render.com and sign up
2. Click "New +" then "Web Service"
3. Connect your GitHub repository: `AnupChauhan1/loopli-crm`
4. Configure the service:
   - **Name**: `loopli-crm-api`
   - **Region**: Oregon (or closest to your database)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `cd apps/api && npm install && npm run build`
   - **Start Command**: `cd apps/api && npm run start:prod`
5. Add Environment Variables:
   - `DATABASE_URL`: [Paste Neon connection string from Step 1]
   - `JWT_SECRET`: [Generate a strong random string - use: `openssl rand -base64 32` or similar]
   - `JWT_EXPIRES_IN`: `7d`
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
6. Click "Create Web Service"
7. Wait for deployment to complete (2-5 minutes)
8. Copy the API URL (will be: `https://loopli-crm-api.onrender.com`)

## Step 3: Run Database Migrations

Once the backend is deployed, you need to run Prisma migrations:

1. Go to your Render service dashboard
2. Click "Shell" (if available) or deploy with migration script
3. Run these commands:
   ```bash
   cd apps/api
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   ```

Alternative: Use the Prisma schema from Neon console directly.

## Step 4: Deploy Frontend (Vercel)

1. Go to https://vercel.com and sign up
2. Click "Add New" then "Project"
3. Import your GitHub repository: `AnupChauhan1/loopli-crm`
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: [Paste Render API URL from Step 2, e.g., `https://loopli-crm-api.onrender.com`]
   - `NEXT_PUBLIC_APP_URL`: [Will be provided by Vercel after deployment, e.g., `https://loopli-crm.vercel.app`]
6. Click "Deploy"
7. Wait for deployment to complete (1-2 minutes)
8. Copy the frontend URL

## Step 5: Update Frontend Environment Variable

1. After Vercel deployment completes, go to project settings
2. Update `NEXT_PUBLIC_APP_URL` with the actual Vercel URL
3. Redeploy the project

## Step 6: Test the Live Application

1. Open your Vercel URL (e.g., `https://loopli-crm.vercel.app`)
2. Test login with:
   - Email: `admin@looply.com`
   - Password: `password123`
3. Verify all features work:
   - Dashboard loads
   - Tasks page works
   - Projects page works
   - CRM pages load
   - All navigation works

## Important Notes

### Database Seeding
To create initial admin user, you may need to manually run the seed script or create the user via the API.

### CORS Configuration
The backend has `origin: true` which allows all origins. For production, you should restrict this to your Vercel domain.

### File Uploads
The current implementation uses local file storage (`apps/api/uploads/`). For production, consider using cloud storage (AWS S3, Cloudflare R2, or Render's disk).

### SSL/HTTPS
Both Render and Vercel provide automatic SSL certificates.

### Build Errors
If you encounter build errors:
1. Check that all dependencies are in package.json
2. Ensure Node.js version is compatible (use Node 18+)
3. Check build logs in Render/Vercel dashboards

## Troubleshooting

### Backend not starting
- Check Render logs for errors
- Verify DATABASE_URL is correct
- Ensure Prisma client is generated

### Frontend API errors
- Verify NEXT_PUBLIC_API_URL is correct
- Check backend is running and accessible
- Check CORS settings

### Database connection errors
- Verify Neon database is active
- Check connection string format
- Ensure SSL mode is enabled

## URLs After Deployment

- **Frontend**: `https://loopli-crm.vercel.app` (or your custom domain)
- **Backend API**: `https://loopli-crm-api.onrender.com`
- **Database**: Neon.tech console
- **GitHub**: https://github.com/AnupChauhan1/loopli-crm

## Cost Summary

All services used are free:
- Neon.tech: Free tier (1GB storage, 100 CU-hours/month)
- Render.com: Free tier (750 hours/month)
- Vercel: Free tier (unlimited deployments, 100GB bandwidth/month)

## Next Steps

1. Set up custom domain (optional)
2. Configure email service for notifications
3. Set up backup strategy
4. Add monitoring and error tracking
5. Configure production-grade file storage
