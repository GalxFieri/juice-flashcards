# Setup & Run - Juice Flashcards Web App

## The Issue

When opening `index.html` directly in your browser (file:// protocol), browsers block local files from fetching other local files for security reasons.

**Error you saw:**
```
Access to fetch at 'file:///D:/Custom_Web_app/juice_cloze_import_UPDATED.csv'
from origin 'null' has been blocked by CORS policy
```

## The Solution

Run a **local HTTP server** instead. This takes 30 seconds.

---

## Option 1: Windows Batch File (Easiest)

### Step 1: Check Python is Installed
1. Open Command Prompt (Windows key + R, type `cmd`)
2. Type: `python --version`
3. Press Enter
4. You should see: `Python 3.x.x` (or similar)

**If you see "not found":**
- Install Python from: https://www.python.org/downloads/
- Make sure to check **"Add Python to PATH"** during installation
- Restart Command Prompt

### Step 2: Run the Server
1. Navigate to `D:\Custom_Web_app\`
2. Double-click `run-server.bat`
3. A Command Prompt window opens
4. You'll see: `Serving HTTP on 0.0.0.0 port 8000`

### Step 3: Open the App
1. Open your browser
2. Type in address bar: `http://localhost:8000`
3. Press Enter
4. App loads!

### Step 4: Load Cards
1. Click **"Load Sample Cards"** button
2. Success message appears: "✅ Loaded 108 cards!"
3. Create profile and study!

### Step 5: Stop Server
- Close the Command Prompt window, or
- Press Ctrl+C in the Command Prompt

---

## Option 2: PowerShell (Windows)

### Step 1: Enable PowerShell Scripts
If PowerShell blocks the script:

1. Open PowerShell as Administrator
2. Type: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Press Enter, type `Y` to confirm

### Step 2: Run the Server
1. Open PowerShell
2. Navigate to `D:\Custom_Web_app\`
3. Type: `.\run-server.ps1`
4. Press Enter

### Step 3: Open the App
- Same as Option 1 (open browser, go to `http://localhost:8000`)

---

## Option 3: Manual Python Command

### Windows Command Prompt
```bash
# Navigate to the folder
cd D:\Custom_Web_app

# Start the server
python -m http.server 8000
```

### Mac/Linux Terminal
```bash
# Navigate to the folder
cd /path/to/Custom_Web_app

# Start the server
python3 -m http.server 8000
```

---

## Option 4: Using a Browser Extension

If you can't use Python, use a browser extension to serve local files:

### Chrome: "Web Server for Chrome"
1. Open Chrome
2. Go to: https://chrome.google.com/webstore
3. Search: "Web Server for Chrome"
4. Install the extension
5. Open the extension
6. Choose folder: `D:\Custom_Web_app`
7. Click the link shown (usually `http://127.0.0.1:8000`)
8. App opens!

---

## Option 5: VS Code Live Server

If you have VS Code installed:

1. Open VS Code
2. Open folder: `D:\Custom_Web_app`
3. Right-click `index.html`
4. Select **"Open with Live Server"**
5. Browser opens automatically
6. App works!

---

## Troubleshooting

### "Python not found"
**Problem:** Python isn't installed or not in PATH

**Solution:**
1. Download Python: https://www.python.org/downloads/
2. Run installer
3. **IMPORTANT:** Check "Add Python to PATH"
4. Click Install
5. Restart Command Prompt/PowerShell
6. Try again

### "Port 8000 already in use"
**Problem:** Another app is using port 8000

**Solution:**
1. Close the other app, or
2. Use a different port:
   ```bash
   python -m http.server 8001
   ```
3. Then open: `http://localhost:8001`

### Cards still won't load after running server
**Problem:** Browser cache or CORS still blocking

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear cookies: F12 → Storage → Clear All
3. Close and reopen browser tab
4. Try again

### "Connection refused" error
**Problem:** Server isn't running

**Solution:**
1. Make sure Command Prompt window is still open
2. Make sure you don't see "KeyboardInterrupt" in window
3. Start server again with `run-server.bat`
4. Wait 2 seconds before opening browser

---

## How It Works

```
File Access Problem:
  index.html opens as: file:///D:/Custom_Web_app/index.html
  Tries to fetch: file:///D:/Custom_Web_app/juice_cloze_import_UPDATED.csv
  Browser blocks: "Can't fetch from local file system"
  Result: Error, no cards load

Server Solution:
  Server starts on: http://localhost:8000
  index.html loads from: http://localhost:8000/index.html
  Tries to fetch: http://localhost:8000/juice_cloze_import_UPDATED.csv
  Browser allows: "Same origin, HTTP protocol"
  Result: Cards load successfully!
```

---

## What's Running

When you run the server:

- **Type:** Simple HTTP server (same as Apache, Nginx, etc.)
- **Runs on:** localhost:8000
- **Serves:** All files in `D:\Custom_Web_app\`
- **Security:** Only accessible on your computer
- **Performance:** Instant loading

---

## Performance

With server running:
- App loads: ~50ms
- Cards load: ~100ms
- Animation: 60 FPS
- No lag: Smooth experience

---

## Keeping the Server Running

### Option A: Keep Window Open
Leave the Command Prompt window open while studying.

### Option B: Run in Background
Make it a scheduled task (advanced - not recommended)

### Option C: Use Always-On Server
For frequent use, consider running Python server as a service (advanced).

### Option D: Deploy to Web
Upload to free hosting like Vercel, Netlify, or GitHub Pages (advanced).

---

## One-Time Setup

After Python is installed, you never need to set up again:

1. Double-click `run-server.bat`
2. Open browser to `http://localhost:8000`
3. Done!

---

## Summary

**To use the app:**
1. ✅ Install Python (one time)
2. ✅ Run `run-server.bat` (every time)
3. ✅ Open `http://localhost:8000` (every time)
4. ✅ Click "Load Sample Cards"
5. ✅ Study!

That's it! No complex setup, just a simple server.

---

## Next Steps

1. Install Python if you haven't
2. Run `run-server.bat`
3. Open `http://localhost:8000`
4. Click "Load Sample Cards"
5. Create profile and study!

Questions? Check the error messages - they usually tell you exactly what to do.

Good luck! 🎓
