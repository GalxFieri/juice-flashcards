# Firebase Architecture Diagram - Juice Flashcards

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Web App (Desktop)  │  Web App (Mobile)  │  iOS PWA  │  Android PWA     │
└──────────┬──────────┴──────────┬──────────┴───────────┴─────────────────┘
           │                     │
           │  Firebase SDK v9    │
           │                     │
┌──────────▼─────────────────────▼──────────────────────────────────────┐
│                        FIREBASE SERVICES                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────┐    ┌─────────────────────┐                  │
│  │ Firebase Auth       │    │ Cloud Firestore     │                  │
│  ├─────────────────────┤    ├─────────────────────┤                  │
│  │ • Email/Password    │    │ Collections:        │                  │
│  │ • Custom Claims     │    │  - users/           │                  │
│  │ • Session Mgmt      │    │  - companies/       │                  │
│  │ • Password Reset    │    │  - adminLogs/       │                  │
│  └──────┬──────────────┘    │  - leaderboards/    │                  │
│         │                   │  - analytics/       │                  │
│         │                   │                     │                  │
│         │                   │ Subcollections:     │                  │
│         │                   │  - cardHistory/     │                  │
│         │                   │  - sessions/        │                  │
│         │                   └──────┬──────────────┘                  │
│         │                          │                                 │
│  ┌──────▼──────────────────────────▼──────────────────┐              │
│  │          Cloud Functions (Node.js 18)               │              │
│  ├─────────────────────────────────────────────────────┤              │
│  │ Triggers:                                           │              │
│  │  • setUserRole (HTTPS)                              │              │
│  │  • logAdminAction (Firestore onUpdate)              │              │
│  │  • calculateDailyStats (Scheduled)                  │              │
│  │  • cleanupOldData (Scheduled)                       │              │
│  │  • exportUserData (HTTPS Callable)                  │              │
│  │  • deleteUserAccount (HTTPS Callable)               │              │
│  │  • updateLeaderboard (Firestore onCreate)           │              │
│  └─────────────────────────────────────────────────────┘              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. User Registration Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Enter email, password, username, (invite code)
     │
┌────▼────────────┐
│  Web App        │
└────┬────────────┘
     │
     │ 2. firebase.auth().createUserWithEmailAndPassword()
     │
┌────▼─────────────┐
│ Firebase Auth    │
│ Creates UID      │
└────┬─────────────┘
     │
     │ 3. Returns user credential
     │
┌────▼────────────┐
│  Web App        │
│ Validates       │
│ invite code     │
└────┬────────────┘
     │
     │ 4. Calls setUserRole Cloud Function
     │
┌────▼──────────────────┐
│ Cloud Function        │
│ - Set custom claims   │
│ - Create Firestore    │
│   profile             │
└────┬──────────────────┘
     │
     │ 5. Write to Firestore
     │
┌────▼──────────────┐
│  Firestore        │
│  users/{uid}      │
│  ├─ email         │
│  ├─ username      │
│  ├─ role          │
│  ├─ stats         │
│  └─ preferences   │
└───────────────────┘
```

---

### 2. Study Session Flow

```
┌─────────┐
│  User   │
│ Studies │
│  Card   │
└────┬────┘
     │
     │ 1. Answer card, click rating
     │
┌────▼────────────┐
│  Web App        │
│ Calculate XP    │
│ Update local    │
│ state           │
└────┬────────────┘
     │
     │ 2. Batch write to Firestore
     │
┌────▼────────────────────────────────┐
│        Firestore Batch Write        │
├─────────────────────────────────────┤
│ users/{uid}                         │
│  └─ stats.totalXP += 100            │
│  └─ stats.currentLevel = 13         │
│  └─ lastStudiedAt = now             │
│                                     │
│ users/{uid}/cardHistory/{cardId}    │
│  └─ attempts.push({                 │
│       timestamp, answer, xp...      │
│     })                              │
│                                     │
│ users/{uid}/sessions/{sessionId}    │
│  └─ cardsStudied++                  │
│  └─ xpEarned += 100                 │
└────┬────────────────────────────────┘
     │
     │ 3. Firestore triggers
     │
┌────▼──────────────────┐
│ Cloud Function        │
│ updateLeaderboard     │
│ (Firestore onCreate)  │
└────┬──────────────────┘
     │
     │ 4. Update leaderboard
     │
┌────▼──────────────────┐
│ leaderboards/weekly   │
│ Recalculate rankings  │
└───────────────────────┘
```

---

### 3. Admin Action Flow (e.g., Reset Password)

```
┌─────────┐
│  Admin  │
└────┬────┘
     │
     │ 1. Click "Reset Password" for user
     │
┌────▼────────────┐
│ Admin Dashboard │
│ (Web App)       │
└────┬────────────┘
     │
     │ 2. Check admin role (client-side)
     │
     │ if (user.role === 'admin') { ... }
     │
┌────▼────────────┐
│ Web App         │
│ Call Cloud      │
│ Function        │
└────┬────────────┘
     │
     │ 3. firebase.functions().httpsCallable('resetPassword')
     │
┌────▼──────────────────────┐
│ Cloud Function            │
│ resetPassword             │
├───────────────────────────┤
│ 1. Verify caller is admin │
│ 2. Send password reset    │
│    email via Firebase     │
│ 3. Log action             │
└────┬──────────────────────┘
     │
     ├───────────────────────┐
     │                       │
┌────▼──────────┐   ┌────▼──────────┐
│ Firebase Auth │   │ adminLogs/    │
│ Send email    │   │ {logId}       │
└───────────────┘   │ - adminId     │
                    │ - action      │
                    │ - targetUser  │
                    │ - timestamp   │
                    └───────────────┘
```

---

## Database Schema Visual

```
Firestore Database
├─ users/
│  ├─ {userId}/
│  │  ├─ userId: string
│  │  ├─ email: string
│  │  ├─ username: string
│  │  ├─ displayName: string
│  │  ├─ role: "employee" | "manager" | "admin" | "super-admin"
│  │  ├─ department: string
│  │  ├─ companyId: string
│  │  ├─ createdAt: Timestamp
│  │  ├─ lastLoginAt: Timestamp
│  │  ├─ lastStudiedAt: Timestamp
│  │  ├─ accountStatus: "active" | "suspended" | "deleted"
│  │  ├─ photoURL: string
│  │  │
│  │  ├─ stats: {
│  │  │    totalXP: number
│  │  │    currentLevel: number
│  │  │    currentStreak: number
│  │  │    longestStreak: number
│  │  │    totalCardsStudied: number
│  │  │    correctCards: number
│  │  │    incorrectCards: number
│  │  │    averageAccuracy: number
│  │  │    totalStudyTimeSeconds: number
│  │  │    ...
│  │  │  }
│  │  │
│  │  ├─ preferences: {
│  │  │    theme: "dark" | "light" | "auto"
│  │  │    notifications: { ... }
│  │  │    studyGoals: { ... }
│  │  │  }
│  │  │
│  │  └─ achievements: { ... }
│  │
│  └─ Subcollections:
│     ├─ cardHistory/
│     │  ├─ {cardId}/
│     │  │  ├─ cardId: string
│     │  │  ├─ attempts: Array<{
│     │  │  │    attemptId, timestamp, userAnswer,
│     │  │  │    expectedAnswer, status, similarity,
│     │  │  │    timeTaken, xpAwarded, rating, sessionId
│     │  │  │  }>
│     │  │  ├─ totalAttempts: number
│     │  │  ├─ correctAttempts: number
│     │  │  ├─ lastAttempted: Timestamp
│     │  │  ├─ averageTime: number
│     │  │  └─ masteryLevel: number (0-1)
│     │
│     └─ sessions/
│        ├─ {sessionId}/
│        │  ├─ sessionId: string
│        │  ├─ startTime: Timestamp
│        │  ├─ endTime: Timestamp
│        │  ├─ durationSeconds: number
│        │  ├─ cardsStudied: number
│        │  ├─ correctAnswers: number
│        │  ├─ accuracy: number
│        │  ├─ xpEarned: number
│        │  ├─ levelStart: number
│        │  ├─ levelEnd: number
│        │  └─ leveledUp: boolean
│
├─ companies/
│  └─ {companyId}/
│     ├─ companyId: string
│     ├─ companyName: string
│     ├─ adminIds: Array<string>
│     ├─ settings: { ... }
│     └─ billing: { ... }
│
├─ adminLogs/
│  └─ {logId}/
│     ├─ logId: string
│     ├─ timestamp: Timestamp
│     ├─ adminId: string
│     ├─ adminEmail: string
│     ├─ action: string
│     ├─ targetUserId: string
│     ├─ targetUserEmail: string
│     ├─ details: { ... }
│     ├─ ipAddress: string
│     └─ userAgent: string
│
├─ adminInvites/
│  └─ {inviteCode}/
│     ├─ inviteCode: string
│     ├─ role: "admin" | "manager"
│     ├─ createdBy: string
│     ├─ createdAt: Timestamp
│     ├─ expiresAt: Timestamp
│     ├─ usedBy: string | null
│     └─ maxUses: number
│
├─ leaderboards/
│  └─ {companyId}/
│     ├─ weekly/
│     │  └─ {period}/
│     │     ├─ period: string (e.g., "2024-W46")
│     │     ├─ rankings: Array<{
│     │     │    rank, userId, displayName, xp
│     │     │  }>
│     │     └─ updatedAt: Timestamp
│     │
│     └─ monthly/
│        └─ ...
│
└─ analytics/
   ├─ company-{companyId}/
   │  └─ {date}/
   │     ├─ date: string (YYYY-MM-DD)
   │     ├─ totalUsers: number
   │     ├─ activeUsers: number
   │     ├─ avgXPperUser: number
   │     ├─ avgLevelperUser: number
   │     ├─ avgAccuracy: number
   │     ├─ totalCardsStudied: number
   │     ├─ totalStudyTimeHours: number
   │     ├─ dailyActiveUsers: number
   │     ├─ topUsers: Array<{ ... }>
   │     └─ weakestCategories: Array<{ ... }>
   │
   └─ department-{deptName}/
      └─ ...
```

---

## Security Rules Visual

```
Firestore Security Rules Structure

┌────────────────────────────────────────────────┐
│            Helper Functions                    │
├────────────────────────────────────────────────┤
│ hasRole(role)                                  │
│   → Check if user has specific role            │
│                                                │
│ isAtLeastRole(role)                            │
│   → Check if user has role or higher           │
│   → employee < manager < admin < super-admin   │
│                                                │
│ isOwnProfile(userId)                           │
│   → Check if userId matches authenticated user │
│                                                │
│ isSameCompany(userId)                          │
│   → Check if target user in same company       │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│              Collection Rules                  │
├────────────────────────────────────────────────┤
│                                                │
│ /users/{userId}                                │
│   READ:  isOwnProfile() OR isAtLeastRole('manager') │
│   WRITE: isOwnProfile()                        │
│   DELETE: isAtLeastRole('admin')               │
│   LIST:  isAtLeastRole('admin')                │
│                                                │
│ /users/{userId}/cardHistory/{cardId}           │
│   READ:  isOwnProfile()                        │
│   WRITE: isOwnProfile()                        │
│                                                │
│ /users/{userId}/sessions/{sessionId}           │
│   READ:  isOwnProfile()                        │
│   WRITE: isOwnProfile()                        │
│                                                │
│ /companies/{companyId}                         │
│   READ:  isSameCompany()                       │
│   WRITE: isAtLeastRole('super-admin')          │
│                                                │
│ /adminLogs/{logId}                             │
│   READ:  isAtLeastRole('admin')                │
│   WRITE: false (only Cloud Functions write)    │
│                                                │
│ /adminInvites/{inviteCode}                     │
│   READ:  true (anyone can read to validate)    │
│   WRITE: isAtLeastRole('super-admin')          │
│                                                │
│ /leaderboards/{document=**}                    │
│   READ:  authenticated                         │
│   WRITE: false (only Cloud Functions write)    │
│                                                │
│ /analytics/{document=**}                       │
│   READ:  isAtLeastRole('manager')              │
│   WRITE: false (only Cloud Functions write)    │
│                                                │
└────────────────────────────────────────────────┘
```

---

## User Interaction Flow (Complete Journey)

```
Day 1: Registration
════════════════════
┌───────┐
│ User  │ → Opens app
└───┬───┘
    │
    ├─→ Clicks "Register"
    │
    ├─→ Enters: email, password, username, department
    │
    ├─→ Submits form
    │
    └─→ Firebase Auth creates account
         └─→ Cloud Function creates Firestore profile
              └─→ User logged in → Redirects to study screen


Day 1-30: Study Sessions
═════════════════════════
┌───────┐
│ User  │ → Logs in
└───┬───┘
    │
    ├─→ Studies 10 cards
    │   ├─→ Answers questions
    │   ├─→ Gets feedback (Perfect/Close/Incorrect)
    │   ├─→ Rates difficulty (Again/Hard/Good/Easy)
    │   └─→ Earns XP
    │        └─→ Firestore updates stats
    │             └─→ Leaderboard auto-updates
    │
    └─→ Sees progress:
        ├─→ Level increased: 1 → 13
        ├─→ XP: 1,250
        ├─→ Accuracy: 81%
        └─→ Streak: 5 days


Week 1: Manager Checks Progress
════════════════════════════════
┌─────────┐
│ Manager │ → Logs in to Admin Dashboard
└────┬────┘
     │
     ├─→ Views Team Analytics
     │   ├─→ 8/8 team members active
     │   ├─→ Team avg accuracy: 82%
     │   └─→ Top performer: Alice
     │
     ├─→ Sees Charlie is inactive
     │   └─→ Sends reminder email (optional future feature)
     │
     └─→ Exports team report (CSV)


Month 1: Admin Review
══════════════════════
┌───────┐
│ Admin │ → Logs in to Admin Dashboard
└───┬───┘
    │
    ├─→ Views Company Analytics
    │   ├─→ 50 total users
    │   ├─→ 42 active users (84%)
    │   ├─→ Avg accuracy: 78.5%
    │   └─→ Total cards studied: 2,350
    │
    ├─→ Identifies weak areas
    │   └─→ Candy Flavors: 65% avg accuracy
    │        └─→ Plans additional training
    │
    ├─→ Resets password for user who forgot
    │   └─→ Action logged in adminLogs
    │
    └─→ Views leaderboard
        └─→ Announces top 3 performers


Quarter 1: Data Retention Cleanup
══════════════════════════════════
┌──────────────┐
│ Cloud        │ → Scheduled function runs
│ Function     │
└──────┬───────┘
       │
       ├─→ Deletes card history older than 1 year
       │   └─→ Aggregates to yearly stats first
       │
       ├─→ Permanently deletes soft-deleted accounts (30+ days)
       │
       └─→ Archives admin logs older than 3 years
```

---

## Cost Breakdown (50 Users)

```
Firebase Pricing (Blaze Plan - Pay-as-you-go)
══════════════════════════════════════════════

Authentication
─────────────
• 50 users × 30 logins/month = 1,500 logins
• Cost: FREE (unlimited)


Cloud Firestore
───────────────
Assumptions:
• 50 users
• 10 cards/day/user
• 30 days/month
• 3 reads per card (load card, check history, update stats)
• 2 writes per card (update stats, log attempt)

Reads:
  50 users × 10 cards × 30 days × 3 reads = 45,000 reads/month
  Cost: FREE (50k free tier)

Writes:
  50 users × 10 cards × 30 days × 2 writes = 30,000 writes/month
  Cost: FREE (20k free + 10k at $0.18/100k = $0.18)

Storage:
  50 users × 100 KB/user = 5 MB
  Cost: FREE (1 GB free tier)

Total Firestore: ~$0.20/month


Cloud Functions
───────────────
Invocations:
• 30,000 writes trigger functions
• Daily scheduled functions: 30 runs/month
• Total: ~30,500 invocations

Cost:
  30,500 invocations (FREE - 2M free tier)
  Compute time: ~$0.50/month (estimate)

Total Functions: ~$0.50/month


Firebase Hosting
────────────────
• Static files: 5 MB
• Bandwidth: 50 users × 100 MB/month = 5 GB
Cost: FREE (10 GB free tier)


TOTAL ESTIMATED COST
════════════════════
Authentication: $0
Firestore: $0.20
Functions: $0.50
Hosting: $0
─────────────────
TOTAL: ~$0.70/month

(Scales linearly with usage)

At 500 users (10x):
  Estimated: ~$7/month

At 5,000 users (100x):
  Estimated: ~$70-100/month
```

---

## Migration Path from localStorage to Firebase

```
Phase 1: Setup
══════════════
Week 1-2
┌─────────────────────────────────────┐
│ 1. Create Firebase project         │
│ 2. Enable Authentication            │
│ 3. Enable Cloud Firestore           │
│ 4. Set up Firebase Hosting          │
│ 5. Install Firebase CLI             │
└─────────────────────────────────────┘

Phase 2: Core Migration
═══════════════════════
Week 3-4
┌─────────────────────────────────────┐
│ 1. Add Firebase SDK to app          │
│ 2. Implement auth flows             │
│    ├─ Register                      │
│    ├─ Login                         │
│    └─ Password reset                │
│ 3. Migrate profile data structure   │
│    ├─ Create Firestore schemas      │
│    └─ Update app to read/write      │
│ 4. Deploy security rules            │
│ 5. Test with 5-10 beta users        │
└─────────────────────────────────────┘

Phase 3: Admin Features
═══════════════════════
Week 5-6
┌─────────────────────────────────────┐
│ 1. Build admin dashboard            │
│    ├─ User list                     │
│    ├─ User detail view              │
│    └─ Basic actions                 │
│ 2. Implement audit logging          │
│ 3. Create admin invite system       │
│ 4. Deploy Cloud Functions           │
└─────────────────────────────────────┘

Phase 4: Analytics
══════════════════
Week 7-8
┌─────────────────────────────────────┐
│ 1. Aggregate stats Cloud Functions  │
│ 2. Department analytics             │
│ 3. Leaderboards                     │
│ 4. Manager dashboards               │
└─────────────────────────────────────┘

Phase 5: Advanced Features
══════════════════════════
Week 9-10
┌─────────────────────────────────────┐
│ 1. GDPR compliance (export/delete)  │
│ 2. Data retention policies          │
│ 3. System health monitoring         │
│ 4. Performance optimization         │
└─────────────────────────────────────┘
```

---

## Key Decisions Summary

| Decision | Recommended Approach | Rationale |
|----------|---------------------|-----------|
| **Authentication** | Email + Password (optional username) | Simple, secure, familiar to users |
| **Database** | Cloud Firestore | Better querying, scalability, security |
| **Admin Creation** | Invite code system | Secure, trackable, user-friendly |
| **Role Levels** | 4 levels (employee/manager/admin/super-admin) | Balanced granularity |
| **2FA** | Optional, admin-only initially | Don't overburden regular users |
| **Data Retention** | Tiered (1 year detailed, forever aggregated) | Compliant, space-efficient |
| **Leaderboard** | Opt-in by default | Privacy-conscious, motivating |
| **Company Structure** | Single project, multi-tenant via companyId | Cost-effective, simpler management |

---

**Diagram Version:** 1.0
**Last Updated:** November 15, 2024
