# Machine Grid — Host from your laptop (company Wi‑Fi)

Everyone uses the **same shared data** as long as they open the app from the host’s URL below.

---

## How to host (you, on your Mac)

1. **Open Terminal** and go to the project folder:
   ```bash
   cd "/Users/wishihara/Documents/Task Tracker"
   ```

2. **Start the server:**
   ```bash
   python3 server.py
   ```
   Leave this window open while people are using the app.

3. **Get your Mac’s IP** (in another Terminal tab or before starting):
   ```bash
   ipconfig getifaddr en0
   ```
   You’ll see something like `10.112.78.25`.

4. **Your URL** (for you on this Mac):
   - **http://localhost:8080**

5. **URL for coworkers** (they use your IP):
   - **http://YOUR_IP:8080**  
   Example: **http://10.112.78.25:8080**

6. **Share that URL** with coworkers (Slack, email, etc.). Anyone on the same company Wi‑Fi who can reach your Mac will see the same grid.

7. **To stop:** In the Terminal where the server is running, press **Ctrl+C**.

---

## How to join (coworkers)

1. **Connect to the same company Wi‑Fi** as the person hosting.

2. **Open a browser** (Chrome, Safari, Edge, etc.).

3. **Go to the URL the host sent you**, e.g.:
   - **http://10.112.78.25:8080**  
   (Replace with the actual IP and port the host gave you.)

4. You should see **Machine Grid** and the same machines/notes as everyone else.  
   If the page doesn’t load, your network may block device-to-device access; try another network or ask IT.

---

## If the host’s IP changes

If you reconnect to Wi‑Fi or the network changes, your IP can change. Run again:

```bash
ipconfig getifaddr en0
```

and share the new URL with coworkers (e.g. **http://NEW_IP:8080**).

---

## If port 8080 is already in use

Stop whatever is using it:

```bash
lsof -i :8080
kill <PID>
```

Then run `python3 server.py` again.
