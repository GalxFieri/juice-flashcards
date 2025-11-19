# Firebase Console Setup - Visual Step-by-Step

## 🎯 After You Create Your Project

Once you see "Your Firebase project is ready!", you'll be in the Firebase Console.

**URL:** https://console.firebase.google.com/project/juice-flashcards-app/overview

---

## ✅ Service 1: Enable Authentication (Email/Password)

### Step 1: Go to Authentication
In the **left sidebar**, look for:
```
Build
  ├── Authentication  ← CLICK HERE
  ├── Firestore Database
  ├── Realtime Database
  └── Storage
```

**Click on "Authentication"**

---

### Step 2: Click "Get Started"
You should see a large button that says:
```
🔑 Get Started
```

**Click it**

---

### Step 3: Choose Email/Password
You'll see a list of sign-in providers:
```
✓ Email/Password     ← CLICK THIS ONE
  Google
  Facebook
  Apple
  etc.
```

**Click on "Email/Password"**

---

### Step 4: Enable It
You'll see a toggle that says:
```
Enable
  [Toggle switch]  ← MAKE SURE THIS IS ON (blue)
```

Make sure the toggle is **ON (blue)**

Click **Save**

---

### ✅ Authentication is now enabled!

You should see:
```
Sign-in providers
  ✓ Email/Password  (Enabled)
```

---

## ✅ Service 2: Enable Firestore Database

### Step 1: Go to Firestore Database
In the **left sidebar**, look for:
```
Build
  ├── Authentication
  ├── Firestore Database  ← CLICK HERE
  ├── Realtime Database
  └── Storage
```

**Click on "Firestore Database"**

---

### Step 2: Click "Create Database"
You should see a button:
```
🔥 Create Database
```

**Click it**

---

### Step 3: Choose Production Mode
You'll see options:
```
Start in production mode
  ✓ Start in test mode (allow all reads/writes)

  ⭕ Start in production mode (secure - need rules)  ← CHOOSE THIS
```

**Select "Start in production mode"** (the radio button on the right)

---

### Step 4: Choose Location
You'll see:
```
Cloud Firestore location

United States (us-central1)  ← GOOD CHOICE
Europe (europe-west1)
Asia-southeast1
etc.
```

**Select: `us-central1`** (or closest to you)

---

### Step 5: Create Database
You'll see a blue button:
```
Create
```

**Click it**

Wait 1-2 minutes for it to finish creating...

---

### ✅ Firestore is now enabled!

You should see:
```
Start with products collection
Collections  Rules  Indexes  etc.
```

With a message like "Your database is ready"

---

## ✅ Service 3: Enable Hosting

### Step 1: Go to Hosting
In the **left sidebar**, look for:
```
Build
  ├── Authentication
  ├── Firestore Database
  ├── Realtime Database
  └── Storage

⬇️ (scroll down)

Build
  ├── Hosting  ← CLICK HERE
```

**Click on "Hosting"**

---

### Step 2: Click "Get Started"
You should see:
```
🚀 Get Started
```

**Click it**

---

### Step 3: Read the Instructions
You'll see instructions about Firebase CLI:
```
1. Install Firebase CLI
   npm install -g firebase-tools

2. Initialize your project
   firebase init

3. Deploy
   firebase deploy
```

**You don't need to do anything here - just click through**

---

### Step 4: Finish the Setup Wizard
Just click "Next" or "Continue" through the wizard until it says "Your Hosting is ready"

---

## ✅ All Three Services Are Now Enabled!

Go back to **Overview** (click the back button or sidebar) and verify:

```
Build
  ✓ Authentication     (enabled)
  ✓ Firestore Database (enabled)
  ✓ Hosting            (ready)
```

---

## 📝 Write Down These Values

You'll need these later for your app:

### In Firebase Console, go to: Settings ⚙️ → Project Settings

Look for these values:
```
Project ID: juice-flashcards-app
Project Number: 123456789  (you'll see this)
```

### In Authentication → Settings (gear icon)

Look for:
```
Authorized domains
  localhost:8000
  juice-flashcards-app.web.app  (will appear after first deploy)
```

---

## ✅ You're Done with Firebase Console!

Now continue with:
1. **Firebase Init** (in command prompt)
2. **Deploy** (firebase deploy)
3. **Test** (visit your app URL)

---

## 🆘 If You Don't See These Options

**Problem:** "I don't see Authentication in the sidebar"

**Solution:**
1. Make sure you're in the right project
2. Check the top of the page - it should say "juice-flashcards-app"
3. Refresh the page (F5)

**If still not there:**
1. Go to https://console.firebase.google.com
2. You should see your project listed
3. Click on it
4. Wait for it to load completely

---

## 📍 Quick Navigation Map

```
https://console.firebase.google.com
         ↓
    [Your Project]
    juice-flashcards-app
         ↓
    Left Sidebar "Build"
         ├─ Authentication (step 1)
         ├─ Firestore Database (step 2)
         └─ Hosting (step 3)
```

---

**Once you've enabled all 3, proceed to Firebase Init in your terminal!** 🚀
