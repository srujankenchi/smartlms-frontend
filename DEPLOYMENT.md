# SmartLMS Frontend Deployment Guide (Vercel)

This frontend is a React + Vite application designed for fast, seamless deployment on [Vercel](https://vercel.com).

---

## 1. Quick Deployment on Vercel

1. Push this repository to your GitHub account (e.g. `smartlms-frontend`).
2. Log into the [Vercel Dashboard](https://vercel.com/dashboard).
3. Click **Add New...** -> **Project**.
4. Import your **smartlms-frontend** GitHub repository.
5. In the project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (or leave default if the repo root is the frontend)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL`: `https://<your-render-backend-name>.onrender.com/api`
7. Click **Deploy**!

---

## 2. Included Configurations

- **`vercel.json`**: Pre-configured with SPA route rewrites (`/(.*) -> /index.html`) so refreshing routes like `/student/dashboard` or `/login` will not result in 404 errors.
- **WebSocket & Asset Resolution**: Automatically connects to your deployed Render backend and resolves file attachments without hardcoded `localhost` references.
