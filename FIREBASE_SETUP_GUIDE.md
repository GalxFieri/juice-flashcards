# Firebase Setup Guide - Step by Step

## Prerequisites
- Node.js installed (or npm access)
- Windows Command Prompt or PowerShell
- 10-15 minutes

---

## ⚡ Step 1: Install Firebase CLI (2 minutes)

Open Command Prompt or PowerShell and run:

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

You should see a version number (e.g., `12.0.0`)

---

## 🔐 Step 2: Login to Firebase (2 minutes)

```bash
firebase login
```

This will:
1. Open your browser
2. Ask you to log in with your Google account
3. Ask for permission to manage Firebase projects
4. Show "Success" when done

---

## 🎯 Step 3: Create Firebase Project (5 minutes)

Go to **https://console.firebase.google.com** and:

1. Click **"Add Project"** or **"Create a project"**
2. **Project name:** `juice-flashcards-app`
3. Click **Continue**
4. **Enable Google Analytics?** No (uncheck it)
5. Click **Create project**
6. Wait for it to finish (1-2 minutes)

**You should see:** "Your Firebase project is ready!"

---

## 🔧 Step 4: Enable Required Services (3 minutes)

**For detailed visual instructions with screenshots, see: [FIREBASE_CONSOLE_SETUP.md](./FIREBASE_CONSOLE_SETUP.md)**

In Firebase Console, enable these services:

### A. Enable Authentication
1. Go to **Authentication** (left sidebar under "Build")
2. Click **Get Started**
3. Select **Email/Password**
4. Toggle **Enable** (make sure it's ON/blue)
5. Click **Save**

### B. Enable Firestore Database
1. Go to **Firestore Database** (left sidebar under "Build")
2. Click **Create Database**
3. Choose **Start in production mode** (not test mode) - select the radio button on the right
4. Choose location: **us-central1** (or closest to you)
5. Click **Create**
6. Wait for it to finish (1-2 minutes)

### C. Enable Hosting
1. Go to **Hosting** (left sidebar under "Build", scroll down if needed)
2. Click **Get Started**
3. Read the instructions but you don't need to do anything yet
4. Click through the wizard until it's done

**After these 3 are enabled, all services should show as ready in your Firebase Console!**

---

## 📁 Step 5: Initialize Firebase in Your Project (3 minutes)

Open Command Prompt/PowerShell and navigate to your project:

```bash
cd D:\Custom_Web_app
```

Then initialize Firebase:

```bash
firebase init
```

You'll be asked questions. Answer as follows:

### Question: "Which Firebase features do you want to set up?"
- Select with **SPACEBAR**:
  - ✅ **Firestore**
  - ✅ **Hosting**
- Press **ENTER** to continue

### Question: "Use an existing project?"
- Select: **Yes**

### Question: "Select a default Firebase project"
- Select: **juice-flashcards-app**

### Question: "What file should be used for Firestore Rules?"
- Press **ENTER** (default: `firestore.rules`)

### Question: "What file should be used for Firestore indexes?"
- Press **ENTER** (default: `firestore.indexes.json`)

### Question: "What do you want to use as your public directory?"
- Type: `.` (single dot - current directory)
- Press **ENTER**

### Question: "Configure as a single-page app?"
- Type: **y**
- Press **ENTER**

### Question: "Set up automatic builds and deploys?"
- Type: **n**
- Press **ENTER**

### Question: "Overwrite index.html?"
- Type: **n** (important! keep your existing file)
- Press **ENTER**

---

## ✅ Verify Files Created

After `firebase init`, you should see:

```
D:\Custom_Web_app\
├── firebase.json          (new)
├── firestore.rules        (new)
├── firestore.indexes.json (new)
├── .firebaserc            (new)
├── index.html             (existing - NOT changed)
└── ... other files
```

Check with:
```bash
dir firebase.json firestore.rules
```

You should see both files listed.

---

## 📝 Step 6: Create Firebase Configuration Files

### A. Update `firestore.rules`

Open `firestore.rules` (created by Firebase init) and **replace its entire contents** with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() && request.auth.token.role == 'admin';
    }

    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      allow read: if isAdmin();
    }

    // User subcollections (card history, sessions)
    match /users/{userId}/{document=**} {
      allow read, write: if isOwner(userId);
      allow read: if isAdmin();
    }

    // Public leaderboards (read-only for signed-in users)
    match /leaderboards/{document=**} {
      allow read: if isSignedIn();
      allow write: if false;
    }
  }
}
```

### B. Update `firebase.json`

Open `firebase.json` and **replace its entire contents** with:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "*.md",
      "*.csv",
      "*.ps1",
      "*.bat",
      ".git/**",
      ".claude/**",
      ".cursor/**",
      ".vscode/**",
      ".superdesign/**",
      "FIREBASE_*.md",
      "PROJECT_SUMMARY.md",
      "README.md",
      "QUICK_START.md",
      "TECHNICAL_OVERVIEW.md",
      "TESTING_CHECKLIST.md",
      "HOW_TO_LOAD_CARDS.md",
      "SETUP_AND_RUN.md",
      "FIXED_SERVER_ISSUE.md",
      "START_HERE.txt",
      "TRY_THIS_NOW.txt",
      "WHAT_WAS_WRONG.txt",
      "LOAD_CARDS_QUICK_REF.txt",
      "run-server.bat",
      "run-server.ps1",
      "juice_cloze_import_UPDATED.csv"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "cleanUrls": true
  }
}
```

---

## 🚀 Step 7: Deploy to Firebase (1 minute)

```bash
firebase deploy
```

This will:
1. Deploy your `index.html` to Firebase Hosting
2. Deploy security rules to Firestore
3. Show your live URL when done

**Success output looks like:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/juice-flashcards-app/overview
Hosting URL: https://juice-flashcards-app.web.app
```

**Copy your Hosting URL!** (example: `https://juice-flashcards-app.web.app`)

---

## ✅ Step 8: Test Your Deployed App

1. Open your **Hosting URL** in a browser
2. The app should work exactly like before
3. No login yet - that's next!

---

## 🎉 Congratulations!

Your app is now hosted on **Firebase Hosting**!

**What's working:**
- ✅ App loads from Firebase
- ✅ Firestore is ready
- ✅ Security rules are deployed
- ✅ Authentication is enabled

**What's next:**
- Add Firebase SDK to `index.html` (enable login)
- Add cloud data sync
- Add admin dashboard

---

## 🔗 Your Firebase Console

Access your project anytime:
**https://console.firebase.google.com/project/juice-flashcards-app/overview**

---

## ⚠️ Troubleshooting

### "firebase: command not found"
```bash
npm install -g firebase-tools
```

### "Error: Could not load config"
Make sure you're in the right directory:
```bash
cd D:\Custom_Web_app
firebase status
```

### "Hosting URL not showing"
Run again:
```bash
firebase deploy --only hosting
```

### "Permission denied"
Make sure you logged in:
```bash
firebase login
firebase projects:list
```

---

**Questions? Check the console output or ask!** 🚀
