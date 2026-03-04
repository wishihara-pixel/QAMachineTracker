# Deploy frontend to Vercel, Mac as backend

The **app UI** is hosted on Vercel (one link for everyone). The **data** still lives on your Mac — your Mac runs `server.py` and the frontend calls it for API requests. Only people who can reach your Mac’s IP will get live data; everyone else will see the UI but get “Local only” until they’re on a network that can reach your Mac.

**Why the app looks empty on the Vercel link:** Vercel is HTTPS, your Mac is HTTP. Browsers block HTTPS→HTTP requests (mixed content), so the app can't load data from your Mac and shows empty. **Use the direct Mac URL** (http://YOUR_IP:8080) so everyone sees the data.

---

## 1. Point the frontend at your Mac

Edit **`config.js`** and set your Mac’s URL (same one you use for coworkers today):

```js
window.MACHINE_GRID_API = 'http://10.112.75.223:8080';  // use your real IP
```

Get your IP with: `ipconfig getifaddr en0`  
If your IP changes (e.g. new Wi‑Fi), update this and redeploy.

---

## 2. Deploy to Vercel

**Option A: Vercel CLI**

```bash
cd "/Users/wishihara/Documents/Task Tracker"
npx vercel
```

Follow the prompts (log in if needed, accept defaults). Vercel will give you a URL like `https://task-tracker-xxx.vercel.app`.

**Option B: GitHub + Vercel**

1. Push this folder to your repo: [github.com/wishihara-pixel/QAMachineTracker](https://github.com/wishihara-pixel/QAMachineTracker)
2. Go to [vercel.com](https://vercel.com) → New Project → Import that repo.
3. Root directory: leave as `.` (project root).
4. Build: leave empty (static site).
5. Deploy.

---

## 3. What to deploy

Vercel will serve everything in the project. The app only needs:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`

You can add a **`.vercelignore`** so the rest isn’t uploaded (optional):

```
server.py
data.json
serve.sh
README-NETWORK.md
DEPLOY-VERCEL.md
.git
```

---

## 4. Run the backend on your Mac

Keep your Mac running the API while people use the Vercel link:

```bash
cd "/Users/wishihara/Documents/Task Tracker"
python3 server.py
```

Leave this terminal open. The Vercel site will call your Mac at the URL in `config.js`.

---

## 5. Share the link

- **Vercel URL** (e.g. `https://your-project.vercel.app`) — share this with coworkers.
- They open it in a browser. If their device can reach your Mac’s IP (same company Wi‑Fi, no VPN blocking it), they’ll see “Shared — connected to server.” If not, they’ll see “Local only.”

---

## Summary

| Where        | What runs                          |
|-------------|-------------------------------------|
| **Vercel**  | Frontend only (HTML, CSS, JS)       |
| **Your Mac**| `server.py` + `data.json` (backend) |

One link for everyone; backend stays on your Mac.
