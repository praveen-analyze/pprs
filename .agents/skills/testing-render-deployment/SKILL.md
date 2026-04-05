# Testing pprs (Municipal Board) on Render

## Overview
The pprs app is a MERN stack complaint reporting system deployed on Render (free tier). It uses MongoDB Atlas, Cloudinary for images, and serves the React frontend from the Express backend.

## Deployed URL
https://municipal-board-system-zta4.onrender.com

## Prerequisites
- MongoDB Atlas must have `0.0.0.0/0` in Network Access (or Render's static outbound IPs whitelisted)
- After changing MongoDB Atlas IP whitelist, **restart the Render service** so the server reconnects
- Free Render instance spins down after inactivity — first request takes ~50s cold start
- Environment variables must be set on Render dashboard (MONGODB_URI, JWT_SECRET, CLIENT_URL, Cloudinary keys, SMTP keys)

## Testable Pages
1. **Home page** (`/`) — Verify Tailwind CSS styles render (hero section, buttons, stats row)
2. **Report form** (`/report`) — 6 category cards (Road, Garbage, Streetlight, Drainage, Water, Other). Step 1 (category selection) is fully testable
3. **Track complaint** (`/track/MUN-YYYY-XXXXX`) — Enter a known complaint number to verify MongoDB connectivity
4. **Admin login** (`/admin`) — Login page renders; needs valid credentials to test dashboard

## API Endpoints for Verification
- `GET /api/health` — Returns `{"status":"ok","timestamp":"..."}` if server + MongoDB connected
- `GET /api/complaints/:complaintNo` — Returns complaint data from MongoDB
- `POST /api/admin/login` — Body: `{"email":"...","password":"..."}`, returns JWT token on success

## Known Limitations
- **Report form step 2** requires camera access and geolocation — these might not be available in headless/testing browsers. Step 2 will block form submission if photo and location are not captured.
- **Photo uploads** use Cloudinary in production. Local uploads go to `/uploads/` directory.
- **Admin credentials** — The database may have a superadmin created by the user with their own password. The seed script creates `admin@municipal.gov / Admin@123` but only if no admin exists yet.

## Render Deployment Notes
- Build command: `npm install && cd client && npm install && npm run build`
- Render sets `NODE_ENV=production`, which skips devDependencies. Build-time packages (tailwindcss, postcss, autoprefixer, vite) must be in `dependencies`, not `devDependencies`
- The `CLIENT_URL` env var must match the actual Render service URL (used for CORS)
- render.yaml blueprint is at repo root

## Devin Secrets Needed
- `RENDER_EMAIL` — Render account email (or use GitHub OAuth)
- `RENDER_PASSWORD` — Render account password (if not using GitHub OAuth)
- `MONGODB_ATLAS_EMAIL` — For managing MongoDB Atlas Network Access
- `MONGODB_ATLAS_PASSWORD` — MongoDB Atlas password
- GitHub device verification code may be needed for Render GitHub OAuth login
