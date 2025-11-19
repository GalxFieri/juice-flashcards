# Get Your Firebase Configuration

## Steps to Get Your Firebase API Keys

1. Go to Firebase Console: https://console.firebase.google.com/project/juice-flashcards-app/settings/general

2. Look for **Your apps** section and click on the **Web app** icon (looks like `</>`)

3. If you don't see a web app, click **Add app** and select **Web**

4. You'll see your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "juice-flashcards-app.firebaseapp.com",
  projectId: "juice-flashcards-app",
  storageBucket: "juice-flashcards-app.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. **Copy the firebaseConfig object** (just the numbers/strings, not the `const firebaseConfig =` part)

6. **Paste it into `firebase-auth.js`** - Replace lines 8-14 with your actual values

---

## Where to Find Each Value

| Field | Where to Find |
|-------|---|
| **apiKey** | Web API key in Firebase Console |
| **authDomain** | `juice-flashcards-app.firebaseapp.com` (auto-filled) |
| **projectId** | `juice-flashcards-app` (auto-filled) |
| **storageBucket** | `juice-flashcards-app.appspot.com` (auto-filled) |
| **messagingSenderId** | In Firebase Console Settings |
| **appId** | In Firebase Console Settings |

---

## After Updating firebase-auth.js

1. Save the file
2. Run: `firebase deploy`
3. Visit your app: https://juice-flashcards-app.web.app
4. Login screen should appear!

---

## Need Help?

If you don't see the Web app section:
1. Go to **Project Settings** (gear icon)
2. Click **Apps** tab
3. Look for your web app
4. If no web app exists, click **Add App** → **Web** → **Register**
5. Copy the config

---

**Once you have your config, update firebase-auth.js and we'll test!** 🚀
