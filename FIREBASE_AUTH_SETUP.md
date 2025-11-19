# Firebase Username/PIN Authentication - Implementation Guide

## Final Specifications (Confirmed)

### **Username Requirements**
- ✅ Alphanumeric (a-z, 0-9)
- ✅ Case-insensitive
- ✅ 2-20 characters
- ✅ Must be unique

### **PIN Requirements**
- ✅ Exactly 4 digits (0000-9999)
- ✅ No complexity rules (1111, 2222 etc. are fine)
- ✅ Can be repeated in change (old PIN required for change)
- ✅ Admin can reset if forgotten

### **Session Management**
- ✅ One active login at a time per username
- ✅ New login on different device logs out old device
- ✅ Session stored locally (sessionStorage) for offline support
- ✅ Cloud sync via Firestore

### **Account Features**
- ✅ Anyone can sign up (no admin approval)
- ✅ PIN can be changed in settings (requires old PIN)
- ✅ Logout clears session
- ✅ Same account can have multiple profiles
- ✅ Cross-device sync (profiles available on all devices after login)

---

## Firestore Data Structure

```javascript
// Collection: users
users/{username}/
  ├── username: "alex"
  ├── pin: "1234"                    // Plain text (store internal use)
  ├── userId: "uuid-generated"       // For profile associations
  ├── createdAt: Timestamp
  ├── lastLoginAt: Timestamp
  └── profiles/{profileId}/
      ├── name: "Profile 1"
      ├── xp: 1250
      ├── currentLevel: 13
      ├── totalCards: 47
      ├── correctCards: 38
      ├── stats: {...}
      ├── createdAt: Timestamp
      └── cardHistory/{cardId}
          └── {...card history data...}
```

---

## Session Storage (localStorage/sessionStorage)

```javascript
// After successful login
sessionStorage.setItem('juiceSession', JSON.stringify({
  username: 'alex',
  userId: 'uuid-123',
  loginTime: timestamp,
  lastSyncTime: timestamp
}));
```

---

## Implementation Phases

### **Phase 1: Firebase SDK & Login UI** (Today)
- [ ] Add Firebase SDK to index.html
- [ ] Create login screen HTML
- [ ] Create signup screen HTML
- [ ] Add login/signup styling

### **Phase 2: Authentication Logic** (Today)
- [ ] Implement signup function
- [ ] Implement signin function
- [ ] Implement logout function
- [ ] Add session management

### **Phase 3: Cloud Integration** (Today)
- [ ] Update Firestore security rules
- [ ] Add offline login support
- [ ] Enable Firestore offline persistence
- [ ] Add data sync on login/logout

### **Phase 4: Testing & Polish** (Today)
- [ ] Test signup flow
- [ ] Test signin flow
- [ ] Test cross-device login (one active at a time)
- [ ] Test offline login
- [ ] Deploy to Firebase

---

## Security Considerations

⚠️ **NOTE: This uses plain-text PINs** (suitable for internal store use only)

For production enterprise use, consider:
- PIN hashing before storage
- Rate limiting on login attempts
- Account lockout after failed attempts
- Audit logging of all auth events

---

## Ready to Build?

All specifications confirmed. Starting implementation now! 🚀

Expected completion: 2-3 hours
Next step: Add Firebase SDK to index.html
