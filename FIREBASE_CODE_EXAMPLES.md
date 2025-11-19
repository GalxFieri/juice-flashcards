# Firebase Implementation Code Examples

## Quick Start: Firebase Setup

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:
- [x] Firestore
- [x] Functions
- [x] Hosting
- [x] Authentication

### 2. Firebase Config (firebaseConfig.js)

```javascript
// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "juice-flashcards.firebaseapp.com",
  projectId: "juice-flashcards",
  storageBucket: "juice-flashcards.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
```

---

## Authentication Examples

### Register New User

```javascript
// auth.js
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebaseConfig';

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} username - Display name
 * @param {string} department - User department
 * @param {string} inviteCode - Optional admin invite code
 * @returns {Promise<User>}
 */
export async function registerUser(email, password, username, department, inviteCode = null) {
  try {
    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Update display name
    await updateProfile(user, { displayName: username });

    // 3. Determine role (check invite code if provided)
    let role = 'employee';
    if (inviteCode) {
      const validateInvite = httpsCallable(functions, 'validateInviteCode');
      const result = await validateInvite({ inviteCode });
      if (result.data.valid) {
        role = result.data.role;
      }
    }

    // 4. Create Firestore profile
    await setDoc(doc(db, 'users', user.uid), {
      userId: user.uid,
      email: email,
      username: username,
      displayName: username,
      role: role,
      department: department,
      companyId: 'default-company',  // Update based on your multi-tenant needs

      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      lastStudiedAt: null,
      accountStatus: 'active',
      photoURL: null,

      stats: {
        totalXP: 0,
        currentLevel: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalCardsStudied: 0,
        correctCards: 0,
        incorrectCards: 0,
        averageAccuracy: 0,
        totalStudyTimeSeconds: 0,
        averageTimePerCard: 0,
        totalSessions: 0,
        lastSessionDate: null,
        cardsStudiedToday: 0,
        xpEarnedToday: 0,
        fastestCard: null,
        slowestCard: null,
        favoriteCategory: null,
        weakestCategory: null
      },

      preferences: {
        theme: 'dark',
        notifications: {
          dailyReminder: true,
          weeklyReport: true,
          achievements: true,
          reminderTime: '09:00'
        },
        studyGoals: {
          cardsPerDay: 20,
          minutesPerDay: 30,
          daysPerWeek: 5
        },
        difficulty: 'adaptive',
        soundEffects: true,
        hapticFeedback: true
      },

      achievements: {}
    });

    // 5. Set custom claims via Cloud Function
    const setRole = httpsCallable(functions, 'setUserRole');
    await setRole({ uid: user.uid, role });

    console.log('User registered successfully:', user.uid);
    return user;

  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}
```

### Login User

```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

/**
 * Login user with email or username
 * @param {string} emailOrUsername - Email or username
 * @param {string} password - Password
 * @returns {Promise<User>}
 */
export async function loginUser(emailOrUsername, password) {
  try {
    let email = emailOrUsername;

    // If input doesn't contain @, treat as username and look up email
    if (!emailOrUsername.includes('@')) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', emailOrUsername), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      email = querySnapshot.docs[0].data().email;
    }

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login timestamp
    await updateDoc(doc(db, 'users', user.uid), {
      lastLoginAt: serverTimestamp()
    });

    console.log('User logged in:', user.uid);
    return user;

  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

### Password Reset

```javascript
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebaseConfig';

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}
```

---

## Study Session Examples

### Record Card Attempt

```javascript
// studySession.js
import {
  doc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

/**
 * Record a card attempt and update user stats
 * @param {string} cardId - Card ID
 * @param {string} userAnswer - User's answer
 * @param {string} expectedAnswer - Expected answer
 * @param {object} validationResult - Result from AnswerValidation.compare()
 * @param {string} rating - User rating (again/hard/good/easy)
 * @param {number} timeTaken - Time in seconds
 * @param {string} sessionId - Current session ID
 */
export async function recordCardAttempt(
  cardId,
  userAnswer,
  expectedAnswer,
  validationResult,
  rating,
  timeTaken,
  sessionId
) {
  const userId = auth.currentUser.uid;

  // Calculate XP
  let baseXP = validationResult.award || 0;

  // Apply rating multiplier
  const multipliers = {
    'again': 1.0,
    'hard': 1.0,
    'good': 1.25,
    'easy': 1.5
  };

  const xpAwarded = Math.floor(baseXP * (multipliers[rating] || 1.0));
  const isCorrect = validationResult.status === 'perfect' ||
                    validationResult.status === 'close' ||
                    validationResult.status === 'close_spelling';

  try {
    // Use batch write for atomic updates
    const batch = writeBatch(db);

    // 1. Update user stats
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      'stats.totalCardsStudied': increment(1),
      'stats.totalXP': increment(xpAwarded),
      'stats.correctCards': increment(isCorrect ? 1 : 0),
      'stats.incorrectCards': increment(isCorrect ? 0 : 1),
      'stats.cardsStudiedToday': increment(1),
      'stats.xpEarnedToday': increment(xpAwarded),
      lastStudiedAt: serverTimestamp()
    });

    // 2. Update card history
    const cardHistoryRef = doc(db, 'users', userId, 'cardHistory', cardId);
    batch.set(cardHistoryRef, {
      cardId: cardId,
      attempts: arrayUnion({
        attemptId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        userAnswer: userAnswer,
        expectedAnswer: expectedAnswer,
        status: validationResult.status,
        similarity: validationResult.similarity || 0,
        timeTaken: timeTaken,
        xpAwarded: xpAwarded,
        rating: rating,
        sessionId: sessionId
      }),
      totalAttempts: increment(1),
      correctAttempts: increment(isCorrect ? 1 : 0),
      lastAttempted: serverTimestamp()
    }, { merge: true });

    // 3. Update session stats
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    batch.update(sessionRef, {
      cardsStudied: increment(1),
      correctAnswers: increment(isCorrect ? 1 : 0),
      xpEarned: increment(xpAwarded)
    });

    // Commit all changes atomically
    await batch.commit();

    console.log('Card attempt recorded:', cardId, xpAwarded, 'XP');

    return { xpAwarded, isCorrect };

  } catch (error) {
    console.error('Error recording card attempt:', error);
    throw error;
  }
}

/**
 * Calculate and update user level after XP change
 * @param {number} totalXP - User's total XP
 * @returns {number} - New level
 */
export function calculateLevel(totalXP) {
  return Math.floor(totalXP / 100) + 1;
}

/**
 * Start a new study session
 * @returns {Promise<string>} - Session ID
 */
export async function startStudySession() {
  const userId = auth.currentUser.uid;
  const sessionId = `session-${Date.now()}`;

  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);

    await setDoc(sessionRef, {
      sessionId: sessionId,
      startTime: serverTimestamp(),
      endTime: null,
      durationSeconds: 0,
      cardsStudied: 0,
      correctAnswers: 0,
      accuracy: 0,
      xpEarned: 0,
      levelStart: await getCurrentLevel(),
      levelEnd: null,
      leveledUp: false
    });

    console.log('Study session started:', sessionId);
    return sessionId;

  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
}

/**
 * End study session
 * @param {string} sessionId - Session to end
 */
export async function endStudySession(sessionId) {
  const userId = auth.currentUser.uid;

  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    const sessionData = sessionDoc.data();
    const startTime = sessionData.startTime.toDate();
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);

    const currentLevel = await getCurrentLevel();
    const leveledUp = currentLevel > sessionData.levelStart;

    await updateDoc(sessionRef, {
      endTime: serverTimestamp(),
      durationSeconds: durationSeconds,
      levelEnd: currentLevel,
      leveledUp: leveledUp,
      accuracy: sessionData.cardsStudied > 0
        ? (sessionData.correctAnswers / sessionData.cardsStudied) * 100
        : 0
    });

    console.log('Study session ended:', sessionId, durationSeconds, 'seconds');

    return {
      cardsStudied: sessionData.cardsStudied,
      correctAnswers: sessionData.correctAnswers,
      xpEarned: sessionData.xpEarned,
      durationSeconds: durationSeconds,
      leveledUp: leveledUp
    };

  } catch (error) {
    console.error('Error ending session:', error);
    throw error;
  }
}

/**
 * Get current user level
 * @returns {Promise<number>}
 */
async function getCurrentLevel() {
  const userId = auth.currentUser.uid;
  const userDoc = await getDoc(doc(db, 'users', userId));

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  return userDoc.data().stats.currentLevel;
}
```

---

## Cloud Functions Examples

### functions/index.js

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// ═══════════════════════════════════════════════════════════
// ADMIN MANAGEMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Set user role (custom claims)
 * Only callable by admins
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Check if caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  // Check if caller is super-admin
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (callerDoc.data().role !== 'super-admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only super-admins can set roles'
    );
  }

  const { uid, role } = data;

  // Validate role
  const validRoles = ['employee', 'manager', 'admin', 'super-admin'];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid role'
    );
  }

  try {
    // Set custom claims
    await auth.setCustomUserClaims(uid, { role });

    // Update Firestore
    await db.collection('users').doc(uid).update({ role });

    // Log action
    await db.collection('adminLogs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      adminId: context.auth.uid,
      action: 'role_updated',
      targetUserId: uid,
      details: { newRole: role }
    });

    return { success: true, message: `Role updated to ${role}` };

  } catch (error) {
    console.error('Error setting role:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Validate invite code
 */
exports.validateInviteCode = functions.https.onCall(async (data, context) => {
  const { inviteCode } = data;

  try {
    const inviteDoc = await db.collection('adminInvites').doc(inviteCode).get();

    if (!inviteDoc.exists()) {
      return { valid: false, message: 'Invalid invite code' };
    }

    const invite = inviteDoc.data();

    // Check if already used
    if (invite.usedBy) {
      return { valid: false, message: 'Invite code already used' };
    }

    // Check if expired
    if (invite.expiresAt.toDate() < new Date()) {
      return { valid: false, message: 'Invite code expired' };
    }

    // Mark as used
    await inviteDoc.ref.update({
      usedBy: context.auth ? context.auth.uid : 'pending',
      usedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      valid: true,
      role: invite.role,
      message: 'Valid invite code'
    };

  } catch (error) {
    console.error('Error validating invite:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Admin reset user password
 */
exports.adminResetPassword = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Check admin role
  if (context.auth.token.role !== 'admin' && context.auth.token.role !== 'super-admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { userId } = data;

  try {
    // Get user email
    const userRecord = await auth.getUser(userId);

    // Send password reset email
    const resetLink = await auth.generatePasswordResetLink(userRecord.email);

    // Log action
    await db.collection('adminLogs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      adminId: context.auth.uid,
      action: 'password_reset',
      targetUserId: userId,
      targetUserEmail: userRecord.email
    });

    return { success: true, resetLink };

  } catch (error) {
    console.error('Error resetting password:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ═══════════════════════════════════════════════════════════
// ANALYTICS FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Calculate daily company analytics
 * Runs every day at midnight
 */
exports.calculateDailyAnalytics = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const companies = await db.collection('companies').get();

    for (const company of companies.docs) {
      const companyId = company.id;

      // Get all users for this company
      const users = await db.collection('users')
        .where('companyId', '==', companyId)
        .get();

      // Calculate aggregated stats
      let totalUsers = 0;
      let activeUsers = 0;
      let totalXP = 0;
      let totalLevel = 0;
      let totalAccuracy = 0;
      let totalCardsStudied = 0;

      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

      users.forEach(userDoc => {
        const user = userDoc.data();
        totalUsers++;

        // Active = logged in last 7 days
        if (user.lastLoginAt && user.lastLoginAt.toMillis() > sevenDaysAgo) {
          activeUsers++;
        }

        totalXP += user.stats.totalXP || 0;
        totalLevel += user.stats.currentLevel || 1;
        totalAccuracy += user.stats.averageAccuracy || 0;
        totalCardsStudied += user.stats.totalCardsStudied || 0;
      });

      const avgXP = totalUsers > 0 ? totalXP / totalUsers : 0;
      const avgLevel = totalUsers > 0 ? totalLevel / totalUsers : 0;
      const avgAccuracy = totalUsers > 0 ? totalAccuracy / totalUsers : 0;

      // Store analytics
      await db.collection('analytics')
        .doc(`company-${companyId}`)
        .collection('daily')
        .doc(new Date().toISOString().split('T')[0])
        .set({
          date: admin.firestore.FieldValue.serverTimestamp(),
          totalUsers,
          activeUsers,
          avgXPperUser: avgXP,
          avgLevelperUser: avgLevel,
          avgAccuracy,
          totalCardsStudied
        });
    }

    console.log('Daily analytics calculated');
  });

/**
 * Update leaderboard when user earns XP
 */
exports.updateLeaderboard = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if XP changed
    if (before.stats.totalXP === after.stats.totalXP) {
      return null;
    }

    const userId = context.params.userId;
    const companyId = after.companyId;

    // Get current week
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const period = `${now.getFullYear()}-W${weekNumber}`;

    // Update weekly leaderboard
    const leaderboardRef = db.collection('leaderboards')
      .doc(companyId)
      .collection('weekly')
      .doc(period);

    await db.runTransaction(async (transaction) => {
      const leaderboardDoc = await transaction.get(leaderboardRef);

      let rankings = [];
      if (leaderboardDoc.exists) {
        rankings = leaderboardDoc.data().rankings || [];
      }

      // Update or add user
      const existingIndex = rankings.findIndex(r => r.userId === userId);
      const userEntry = {
        userId,
        displayName: after.displayName,
        xp: after.stats.totalXP
      };

      if (existingIndex >= 0) {
        rankings[existingIndex] = userEntry;
      } else {
        rankings.push(userEntry);
      }

      // Sort by XP descending
      rankings.sort((a, b) => b.xp - a.xp);

      // Add ranks
      rankings = rankings.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

      // Keep top 100
      rankings = rankings.slice(0, 100);

      transaction.set(leaderboardRef, {
        period,
        rankings,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    console.log('Leaderboard updated for user:', userId);
  });

// ═══════════════════════════════════════════════════════════
// DATA MANAGEMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Export user data (GDPR compliance)
 */
exports.exportUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;

  try {
    // Get user profile
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Get card history
    const cardHistorySnapshot = await db.collection('users')
      .doc(userId)
      .collection('cardHistory')
      .get();
    const cardHistory = cardHistorySnapshot.docs.map(d => d.data());

    // Get sessions
    const sessionsSnapshot = await db.collection('users')
      .doc(userId)
      .collection('sessions')
      .get();
    const sessions = sessionsSnapshot.docs.map(d => d.data());

    return {
      profile: userData,
      cardHistory,
      sessions,
      exportDate: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error exporting data:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cleanup old data (scheduled)
 */
exports.cleanupOldData = functions.pubsub
  .schedule('0 3 * * 0')  // Every Sunday at 3 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);

    // This is a simplified version - in production you'd need to
    // paginate through results to avoid timeout
    const oldDataQuery = await db.collectionGroup('cardHistory')
      .where('lastAttempted', '<', new Date(oneYearAgo))
      .limit(500)
      .get();

    const batch = db.batch();
    oldDataQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${oldDataQuery.size} old card history records`);
  });

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
```

---

## Firestore Security Rules

### firestore.rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ═══════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function isAuthenticated() {
      return request.auth != null;
    }

    function isUser(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function hasRole(role) {
      return isAuthenticated() && request.auth.token.role == role;
    }

    function isAtLeastRole(role) {
      let roles = ['employee', 'manager', 'admin', 'super-admin'];
      let userRoleIndex = roles.indexOf(request.auth.token.role);
      let requiredRoleIndex = roles.indexOf(role);
      return userRoleIndex >= requiredRoleIndex;
    }

    function isSameCompany(userId) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId
             == get(/databases/$(database)/documents/users/$(userId)).data.companyId;
    }

    // ═══════════════════════════════════════════════════════════
    // USERS COLLECTION
    // ═══════════════════════════════════════════════════════════

    match /users/{userId} {
      // Read: own profile OR manager+ can see all
      allow read: if isUser(userId) || isAtLeastRole('manager');

      // Write: only own profile (admins use Cloud Functions)
      allow write: if isUser(userId);

      // Delete: admin only
      allow delete: if isAtLeastRole('admin');

      // Subcollections
      match /cardHistory/{cardId} {
        allow read, write: if isUser(userId);
      }

      match /sessions/{sessionId} {
        allow read, write: if isUser(userId);
      }
    }

    // List all users (admin only)
    match /users/{userId} {
      allow list: if isAtLeastRole('admin');
    }

    // ═══════════════════════════════════════════════════════════
    // COMPANIES
    // ═══════════════════════════════════════════════════════════

    match /companies/{companyId} {
      allow read: if isAuthenticated() && isSameCompany(request.auth.uid);
      allow write: if hasRole('super-admin');
    }

    // ═══════════════════════════════════════════════════════════
    // ADMIN LOGS
    // ═══════════════════════════════════════════════════════════

    match /adminLogs/{logId} {
      allow read: if isAtLeastRole('admin');
      allow write: if false;  // Only Cloud Functions
    }

    // ═══════════════════════════════════════════════════════════
    // ADMIN INVITES
    // ═══════════════════════════════════════════════════════════

    match /adminInvites/{inviteCode} {
      allow read: if true;  // Anyone can validate
      allow write: if hasRole('super-admin');
    }

    // ═══════════════════════════════════════════════════════════
    // LEADERBOARDS
    // ═══════════════════════════════════════════════════════════

    match /leaderboards/{companyId}/{document=**} {
      allow read: if isAuthenticated() && isSameCompany(companyId);
      allow write: if false;  // Only Cloud Functions
    }

    // ═══════════════════════════════════════════════════════════
    // ANALYTICS
    // ═══════════════════════════════════════════════════════════

    match /analytics/{document=**} {
      allow read: if isAtLeastRole('manager');
      allow write: if false;  // Only Cloud Functions
    }
  }
}
```

---

## Admin Dashboard Example (React)

```javascript
// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Load users
      const usersQuery = query(
        collection(db, 'users'),
        where('companyId', '==', 'default-company'),
        orderBy('stats.totalXP', 'desc'),
        limit(50)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      // Load analytics
      const today = new Date().toISOString().split('T')[0];
      const analyticsDoc = await getDoc(
        doc(db, 'analytics', 'company-default-company', 'daily', today)
      );
      setAnalytics(analyticsDoc.data());

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* Analytics Overview */}
      <div className="analytics-overview">
        <h2>Company Analytics</h2>
        {analytics && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Users</h3>
              <p className="stat-value">{analytics.totalUsers}</p>
            </div>
            <div className="stat-card">
              <h3>Active Users</h3>
              <p className="stat-value">{analytics.activeUsers}</p>
            </div>
            <div className="stat-card">
              <h3>Avg XP/User</h3>
              <p className="stat-value">{analytics.avgXPperUser.toFixed(0)}</p>
            </div>
            <div className="stat-card">
              <h3>Avg Accuracy</h3>
              <p className="stat-value">{analytics.avgAccuracy.toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>

      {/* User List */}
      <div className="user-list">
        <h2>Users</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Level</th>
              <th>XP</th>
              <th>Accuracy</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.displayName}</td>
                <td>{user.email}</td>
                <td>{user.department}</td>
                <td>{user.stats.currentLevel}</td>
                <td>{user.stats.totalXP}</td>
                <td>{user.stats.averageAccuracy.toFixed(1)}%</td>
                <td>{formatDate(user.lastLoginAt)}</td>
                <td>
                  <button onClick={() => viewUserDetails(user.id)}>View</button>
                  <button onClick={() => resetUserPassword(user.id)}>Reset Pwd</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(timestamp) {
  if (!timestamp) return 'Never';
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
}

async function viewUserDetails(userId) {
  // Navigate to user detail page
  window.location.href = `/admin/users/${userId}`;
}

async function resetUserPassword(userId) {
  if (!confirm('Send password reset email to this user?')) return;

  try {
    const resetPassword = httpsCallable(functions, 'adminResetPassword');
    await resetPassword({ userId });
    alert('Password reset email sent!');
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to reset password');
  }
}
```

---

## Deployment Commands

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only hosting
firebase deploy --only hosting

# Test functions locally
firebase emulators:start

# View logs
firebase functions:log
```

---

**Code Examples Version:** 1.0
**Last Updated:** November 15, 2024
