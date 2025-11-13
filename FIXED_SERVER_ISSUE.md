# Fixed: Server Directory Issue

## What Was Wrong

The server was running from the wrong directory (`C:\`) instead of `D:\Custom_Web_app\`.

This is why you saw a directory listing of Windows system files instead of your app.

## What's Fixed

I've updated `run-server.bat` to:
1. ✅ Automatically detect the correct directory
2. ✅ Verify all required files exist
3. ✅ Start the server from the correct location
4. ✅ Show you what directory it's using

## How to Use the Fixed Version

### Step 1: Close the Old Server
- Press Ctrl+C in the Command Prompt window running the old server
- Or close the Command Prompt window

### Step 2: Run the New Server
1. Navigate to: `D:\Custom_Web_app\`
2. Double-click: `run-server.bat`
3. You'll see output like:

```
====================================================
  Juice Flashcards - Local Server Launcher
====================================================

Current directory: D:\Custom_Web_app\

✓ All files found!

Starting local server...

The app will be available at: http://localhost:8000

Server is running from: D:\Custom_Web_app\
```

### Step 3: Open Your Browser
Type: `http://localhost:8000`

Press Enter.

You should now see:
- The "Juice Training" header
- The profile selection screen
- The "Load Sample Cards" button at the bottom

(NOT a directory listing of Windows files)

### Step 4: Click "Load Sample Cards"
- Golden button at the bottom
- Popup shows: "✅ Loaded 108 cards!"
- Cards are now ready!

### Step 5: Create Profile and Study
- Enter your name
- Click Create
- Select your profile
- Type your answer
- Tap to flip
- Rate your answer

## If It Still Shows Directory Listing

This means the server is still running from the wrong location.

**Solution:**

1. Close Command Prompt completely (Ctrl+C or close window)
2. Wait 5 seconds
3. Double-click `run-server.bat` again
4. Check the output shows: `Server is running from: D:\Custom_Web_app\`
5. Try `http://localhost:8000` again

## If It Shows Connection Refused

The server crashed or isn't running.

**Solution:**

1. Double-click `run-server.bat` again
2. Look for error messages in Command Prompt
3. If you see "ERROR: index.html not found"
   - Make sure `run-server.bat` is in `D:\Custom_Web_app\`
   - Make sure `index.html` is also in `D:\Custom_Web_app\`

## File Location Check

All these files must be in the **same folder** (`D:\Custom_Web_app\`):

```
D:\Custom_Web_app\
├── index.html                      ✓
├── juice_cloze_import_UPDATED.csv  ✓
├── run-server.bat                  ✓
├── answer-validation.js            ✓
├── profile-system.js               ✓
└── load-cards.js                   ✓
```

**NOT** in subfolders, all in the same folder!

## What the New Server Does

1. **Detects location**: Figures out where `run-server.bat` is located
2. **Verifies files**: Checks that `index.html` and CSV exist
3. **Reports location**: Shows you the directory it's serving from
4. **Serves files**: Starts HTTP server on port 8000
5. **Shows errors**: If files are missing, tells you exactly what's wrong

## Testing

To verify the server is working:

1. Run `run-server.bat`
2. Open browser to `http://localhost:8000`
3. You should see "Juice Training" heading
4. If you see directory listing → Server still in wrong folder
5. If you see app → Success! ✅

## Next Steps

1. ✅ Close old Command Prompt window
2. ✅ Double-click the updated `run-server.bat`
3. ✅ Open `http://localhost:8000`
4. ✅ Click "Load Sample Cards"
5. ✅ Start studying!

---

**The server should now work correctly!** 🎉

If you still have issues, the error messages in the Command Prompt window will tell you exactly what's wrong.
