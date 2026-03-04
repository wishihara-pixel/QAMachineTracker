# Deploy Machine Grid on Vercel — one link, everyone sees the same data

Use **full Vercel** (frontend + API + Redis): one HTTPS link for the whole team, no Mac needed, no network restrictions.

---

## Option A: Full Vercel (recommended)

**One link. Everyone gets the same view. No Mac, no VPN issues.**

### 1. Add Upstash Redis to your Vercel project

1. Open your project on [vercel.com](https://vercel.com) (e.g. QAMachineTracker).
2. Go to **Storage** (or **Integrations** / **Marketplace**).
3. Create or connect **Upstash Redis** (free tier is enough).
4. Link it to this project. Vercel will add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` automatically.

### 2. Deploy from GitHub

1. Push the latest code (includes `api/data.js`, `package.json`, empty `config.js`).
2. In Vercel, trigger a redeploy (Deployments → … → Redeploy), or push a new commit.
3. Vercel will run `npm install` and deploy the serverless API at `/api/data`.

### 3. Share the link

- Use your Vercel URL (e.g. `https://qamachinetracker-xxx.vercel.app`).
- Everyone who opens it sees the **same** machines and stickies. Data is stored in Redis; the app is pre-seeded with your current machines and stickies on first load.

### 4. No Mac needed

- You don’t run `server.py` for this. The backend is the Vercel serverless API + Redis.
- `config.js` is left **empty** so the app uses the same origin (`/api/data` on Vercel).

---

## Option B: Vercel frontend + Mac backend (legacy)

Only if you must keep the backend on your Mac:

1. Set **`config.js`** to your Mac URL: `window.MACHINE_GRID_API = 'http://YOUR_MAC_IP:8080';`
2. Run **`python3 server.py`** on your Mac and keep it running.
3. Share the **Mac URL** with coworkers (not the Vercel URL), because browsers block HTTPS→HTTP: **http://YOUR_MAC_IP:8080**

Everyone must be able to reach your Mac on the network; the Vercel URL will not load data when the backend is on your Mac.

---

## Summary

| Setup              | Link to share        | Who can see data        |
|--------------------|---------------------|--------------------------|
| **Full Vercel (A)**| Vercel URL (HTTPS)  | Everyone, one shared view |
| **Mac backend (B)**| Mac URL (HTTP)      | Only devices that can reach your Mac |

Use **Option A** so the whole team gets one link and the same view.
