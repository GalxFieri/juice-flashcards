# Firebase Username/PIN Authentication Implementation

## Overview

We will add a simple username/PIN (4-digit) authentication system to your Juice Flashcards app without using Firebase Authentication (we'll build custom auth on top of Firestore).

---

## Architecture

### **Data Structure in Firestore**

```
users/{username}/
  ├── username: "alex"
  ├── pin: "1234"                    (plain text, since internal store use)
  ├── userId: "auto-generated-id"    (for profile associations)
  ├── createdAt: timestamp
  ├── lastLoginAt: timestamp
  └── profiles/{profileId}/
      ├── name: "Profile Name"
      ├── xp: 1250
      ├── currentLevel: 13
      ├── stats: {...}
      └── ...
```

### **Session Management**

```javascript
// sessionStorage (for offline support)
sessionStorage.setItem('currentUser', {
  username: 'alex',
  userId: 'uuid123',
  loginTime: timestamp
});

// Firestore (for cloud sync)
// Automatically syncs when online
```

---

## Implementation Steps

### **Step 1: Add Firebase SDK to index.html** (Lines before 782)

### **Step 2: Create Login Screen UI** (New screen before profile screen)

### **Step 3: Implement Auth Functions**
- Sign up (create username + PIN)
- Sign in (verify username + PIN)
- Logout
- Session management

### **Step 4: Update Existing Functions**
- Replace localStorage calls with Firestore
- Add user context to profile operations
- Enable offline persistence

### **Step 5: Add Data Migration**
- Allow users to import existing localStorage profiles to cloud
- Handle multiple devices/logins

---

## Features

✅ **Username/PIN authentication** (4-digit PIN)
✅ **Cloud data sync** (hybrid offline-first)
✅ **Multiple profiles per user**
✅ **Cross-device support** (same login, different devices)
✅ **Offline login** (cached credentials)
✅ **Session management** (logout clears session)
✅ **Simple & fast** (no email verification, no complex flows)

---

## Username & PIN Rules (Confirm These)

1. **Username**: Alphanumeric, 3-20 characters?
2. **PIN**: 0000-9999, exactly 4 digits?
3. **Sign up**: Anyone can create account without admin approval?
4. **Account recovery**: No recovery (contact admin to reset)?

---

## Ready to Implement?

Confirm the above and I'll build the complete system! 🚀
