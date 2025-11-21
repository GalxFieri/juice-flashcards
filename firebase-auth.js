/**
 * Firebase Authentication Module
 * Username/PIN based authentication for Juice Flashcards
 * Supports offline login and cloud sync
 */

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBS3_8ma3W95wmPahH0isUtyMklmpr7vwc",
    authDomain: "juice-flashcards-app.firebaseapp.com",
    projectId: "juice-flashcards-app",
    storageBucket: "juice-flashcards-app.firebasestorage.app",
    messagingSenderId: "532667186294",
    appId: "1:532667186294:web:a1614ae1df80407952b357"
};

let db = null;
let currentSession = null;
let doc = null;
let getDoc = null;
let setDoc = null;
let updateDoc = null;
let deleteDoc = null;
let collection = null;
let getDocs = null;
let query = null;

/**
 * Hash PIN using SHA-256 for secure storage
 * Creates a reproducible hash for PIN verification
 */
async function hashPin(pin) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Error hashing PIN:', error);
        throw error;
    }
}

/**
 * Initialize Firebase
 */
async function initializeFirebase() {
    try {
        // Import Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, enableIndexedDbPersistence, doc: docFunc, getDoc: getDocFunc, setDoc: setDocFunc, updateDoc: updateDocFunc, deleteDoc: deleteDocFunc, collection: collectionFunc, getDocs: getDocsFunc, query: queryFunc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        // Assign imported functions to global scope within this module
        doc = docFunc;
        getDoc = getDocFunc;
        setDoc = setDocFunc;
        updateDoc = updateDocFunc;
        deleteDoc = deleteDocFunc;
        collection = collectionFunc;
        getDocs = getDocsFunc;
        query = queryFunc;

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);

        // Enable offline persistence
        try {
            await enableIndexedDbPersistence(db);
            console.log('Offline persistence enabled');
        } catch (err) {
            if (err.code === 'failed-precondition') {
                console.warn('Multiple tabs open - offline persistence disabled');
            } else if (err.code === 'unimplemented') {
                console.warn('Offline persistence not supported');
            }
        }

        // Load session if exists
        loadSession();

        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
}

/**
 * Sign up - Create new user account
 */
async function signUp(username, pin) {
    try {
        username = username.toLowerCase().trim();
        pin = pin.trim();

        // Validation
        if (!validateUsername(username)) {
            return { success: false, error: 'Username must be 2-20 alphanumeric characters' };
        }
        if (!validatePin(pin)) {
            return { success: false, error: 'PIN must be exactly 4 digits' };
        }

        // Check if username exists
        const { getDocs, collection, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, error: 'Username already exists' };
        }

        // Hash PIN before storing
        const pinHash = await hashPin(pin);

        // Create user document
        const { setDoc, doc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const userId = generateUserId();

        const userDoc = {
            username: username,
            pinHash: pinHash,  // Hashed PIN for security
            userId: userId,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
        };

        await setDoc(doc(db, 'users', username), userDoc);

        // Create session
        createSession(username, userId);

        // Cache plain PIN for offline use
        cacheCredentials(username, pin);

        return { success: true, username: username, userId: userId };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: 'Sign up failed: ' + error.message };
    }
}

/**
 * Sign in - Authenticate user
 */
async function signIn(username, pin) {
    try {
        username = username.toLowerCase().trim();
        pin = pin.trim();

        // Validation
        if (!username || !pin) {
            return { success: false, error: 'Username and PIN required' };
        }

        // Try cloud authentication first
        const cloudResult = await signInCloud(username, pin);

        if (cloudResult.success) {
            // Cloud auth succeeded - create session and sync
            createSession(username, cloudResult.userId);
            await syncProfilesFromCloud(username);
            return cloudResult;
        }

        // Try offline authentication
        const offlineResult = signInOffline(username, pin);

        if (offlineResult.success) {
            return offlineResult;
        }

        return { success: false, error: 'Invalid username or PIN' };
    } catch (error) {
        console.error('Sign in error:', error);
        // Fall back to offline
        return signInOffline(username, pin);
    }
}

/**
 * Cloud sign in - Verify against Firestore
 */
async function signInCloud(username, pin) {
    try {
        const { getDocs, collection, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: 'User not found' };
        }

        const userData = querySnapshot.docs[0].data();

        // Compare PIN with hash (support both old plain text and new hashed)
        const pinHash = await hashPin(pin);
        const isValidPin = (userData.pinHash === pinHash) || (userData.pin === pin);

        if (!isValidPin) {
            return { success: false, error: 'Invalid PIN' };
        }

        // If user still has plain text PIN, migrate to hash
        if (userData.pin === pin && !userData.pinHash) {
            const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            await updateDoc(doc(db, 'users', username), {
                pinHash: pinHash,
                pin: null // Remove plain text PIN
            });
        }

        // Update last login
        const { updateDoc, doc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await updateDoc(doc(db, 'users', username), {
            lastLoginAt: serverTimestamp()
        });

        // Cache credentials for offline use
        cacheCredentials(username, pin);

        return { success: true, username: username, userId: userData.userId };
    } catch (error) {
        console.error('Cloud sign in error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Offline sign in - Check cached credentials
 */
function signInOffline(username, pin) {
    try {
        const cached = getCachedCredentials();

        if (!cached || cached.username !== username.toLowerCase() || cached.pin !== pin) {
            return { success: false, error: 'Invalid credentials (offline mode)' };
        }

        // Restore session from cache
        const session = JSON.parse(sessionStorage.getItem('juiceSession') || '{}');

        if (session.username === username.toLowerCase()) {
            createSession(username, session.userId);
            return { success: true, username: username, userId: session.userId, offline: true };
        }

        return { success: false, error: 'Session not found (offline mode)' };
    } catch (error) {
        console.error('Offline sign in error:', error);
        return { success: false, error: 'Offline sign in failed' };
    }
}

/**
 * Sign out - End session
 */
async function signOut() {
    try {
        // Clear session
        sessionStorage.removeItem('juiceSession');
        currentSession = null;

        // Log out from all devices except current (achieved by clearing lastLoginAt)
        // This is handled automatically - next login overwrites session

        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Change PIN
 */
async function changePin(username, oldPin, newPin) {
    try {
        // Verify old PIN
        const session = getCurrentSession();
        if (!session || session.username !== username.toLowerCase()) {
            return { success: false, error: 'Not authenticated' };
        }

        // Verify old PIN
        const { getDocs, collection, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: 'User not found' };
        }

        const userData = querySnapshot.docs[0].data();

        // Compare old PIN with hash (support both old plain text and new hashed)
        const oldPinHash = await hashPin(oldPin);
        const isValidPin = (userData.pinHash === oldPinHash) || (userData.pin === oldPin);

        if (!isValidPin) {
            return { success: false, error: 'Old PIN is incorrect' };
        }

        // Validate new PIN
        if (!validatePin(newPin)) {
            return { success: false, error: 'New PIN must be exactly 4 digits' };
        }

        // Hash new PIN before storing
        const newPinHash = await hashPin(newPin);

        // Update PIN in Firestore (use hashed PIN)
        const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await updateDoc(doc(db, 'users', username.toLowerCase()), {
            pinHash: newPinHash,
            pin: null // Remove old plain text PIN field
        });

        // Update cached credentials
        cacheCredentials(username, newPin);

        return { success: true, message: 'PIN changed successfully' };
    } catch (error) {
        console.error('Change PIN error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create session
 */
function createSession(username, userId) {
    currentSession = {
        username: username.toLowerCase(),
        userId: userId,
        loginTime: Date.now()
    };

    sessionStorage.setItem('juiceSession', JSON.stringify(currentSession));
}

/**
 * Load session from storage
 */
function loadSession() {
    const session = sessionStorage.getItem('juiceSession');
    if (session) {
        try {
            currentSession = JSON.parse(session);
        } catch (e) {
            currentSession = null;
        }
    }
}

/**
 * Get current session
 */
function getCurrentSession() {
    return currentSession;
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return currentSession !== null;
}

/**
 * Cache credentials for offline use
 */
function cacheCredentials(username, pin) {
    try {
        const cached = {
            username: username.toLowerCase(),
            pin: pin,
            cachedAt: Date.now()
        };
        localStorage.setItem('juice_cached_auth', JSON.stringify(cached));
    } catch (e) {
        console.warn('Could not cache credentials:', e);
    }
}

/**
 * Get cached credentials
 */
function getCachedCredentials() {
    try {
        const cached = localStorage.getItem('juice_cached_auth');
        return cached ? JSON.parse(cached) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Sync profiles from cloud
 */
async function syncProfilesFromCloud(username) {
    try {
        const { getDocs, collection } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const profilesRef = collection(db, 'users', username.toLowerCase(), 'profiles');
        const snapshot = await getDocs(profilesRef);

        const profiles = [];
        snapshot.forEach(doc => {
            profiles.push(doc.data());
        });

        if (profiles.length > 0) {
            // Merge with existing profiles
            const existing = JSON.parse(localStorage.getItem('juice_profiles') || '[]');
            const merged = mergeProfiles(existing, profiles);
            localStorage.setItem('juice_profiles', JSON.stringify(merged));
        }

        return true;
    } catch (error) {
        console.warn('Could not sync profiles:', error);
        return false;
    }
}

/**
 * Save profiles to cloud
 */
async function saveProfilesToCloud(profiles) {
    try {
        const session = getCurrentSession();
        if (!session) {
            console.warn('Not logged in - profiles not synced to cloud');
            return false;
        }

        const { setDoc, doc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        for (const profile of profiles) {
            const profileData = {
                ...profile,
                lastUpdated: serverTimestamp()
            };
            await setDoc(doc(db, 'users', session.username, 'profiles', profile.id), profileData);
        }

        return true;
    } catch (error) {
        console.warn('Could not save profiles to cloud:', error);
        return false;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate username format
 */
function validateUsername(username) {
    if (!username || username.length < 2 || username.length > 20) {
        return false;
    }
    return /^[a-z0-9]+$/i.test(username);
}

/**
 * Validate PIN format
 */
function validatePin(pin) {
    if (!pin || pin.length !== 4) {
        return false;
    }
    return /^\d{4}$/.test(pin);
}

/**
 * Generate unique user ID
 */
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Merge local and cloud profiles
 */
function mergeProfiles(local, cloud) {
    const merged = [...local];

    for (const cloudProfile of cloud) {
        const exists = merged.find(p => p.id === cloudProfile.id);
        if (!exists) {
            merged.push(cloudProfile);
        } else {
            // Keep cloud version if newer
            if (cloudProfile.lastUpdated > exists.lastUpdated) {
                Object.assign(exists, cloudProfile);
            }
        }
    }

    return merged;
}

/**
 * Save a card rating (difficulty) to Firestore
 */
async function saveCardRating(username, profileId, cardId, difficulty) {
    try {
        if (!db) {
            console.warn('Database not initialized');
            return;
        }

        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        const cardHistoryRef = doc(
            db,
            'users',
            username,
            'profiles',
            profileId,
            'cardHistory',
            cardId
        );

        await setDoc(cardHistoryRef, {
            cardId: cardId,
            difficulty: difficulty,
            lastRated: new Date().toISOString(),
            updatedAt: Date.now()
        }, { merge: true });

        console.log(`Card ${cardId} rated as ${difficulty}`);
    } catch (error) {
        console.error('Error saving card rating:', error);
        throw error;
    }
}

/**
 * Load card history (difficulties) from Firestore
 */
async function loadCardHistories(username, profileId) {
    try {
        if (!db) {
            console.warn('Database not initialized');
            return {};
        }

        const { collection, query, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        const cardHistoryRef = collection(db, 'users', username, 'profiles', profileId, 'cardHistory');
        const querySnapshot = await getDocs(query(cardHistoryRef));

        const histories = {};
        querySnapshot.forEach(doc => {
            const data = doc.data();
            histories[data.cardId] = {
                difficulty: data.difficulty,
                lastRated: data.lastRated,
                updatedAt: data.updatedAt
            };
        });

        console.log(`Loaded ${Object.keys(histories).length} card histories`);
        return histories;
    } catch (error) {
        console.error('Error loading card histories:', error);
        throw error;
    }
}

/**
 * Queue a card rating for offline storage
 * Used when user is offline and rates a card
 */
function queueCardRating(username, profileId, cardId, difficulty) {
    try {
        const queueKey = 'juice_pending_ratings';
        const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');

        // Add rating to queue with metadata
        queue.push({
            username: username.toLowerCase(),
            profileId: profileId,
            cardId: cardId,
            difficulty: difficulty,
            ratedAt: new Date().toISOString(),
            syncAttempts: 0
        });

        localStorage.setItem(queueKey, JSON.stringify(queue));
        console.log(`Card ${cardId} queued for sync (total pending: ${queue.length})`);
        return true;
    } catch (error) {
        console.error('Error queueing card rating:', error);
        return false;
    }
}

/**
 * Get all pending card ratings from queue
 */
function getPendingRatings() {
    try {
        const queueKey = 'juice_pending_ratings';
        return JSON.parse(localStorage.getItem(queueKey) || '[]');
    } catch (error) {
        console.error('Error retrieving pending ratings:', error);
        return [];
    }
}

/**
 * Sync pending card ratings to Firestore
 * Called when user comes online or at app startup
 */
async function syncPendingRatings(username, profileId) {
    try {
        const pending = getPendingRatings();

        if (pending.length === 0) {
            console.log('No pending ratings to sync');
            return { success: true, synced: 0 };
        }

        console.log(`Syncing ${pending.length} pending card ratings...`);

        // Filter pending ratings for this user/profile
        const toSync = pending.filter(r =>
            r.username === username.toLowerCase() && r.profileId === profileId
        );

        if (toSync.length === 0) {
            console.log('No pending ratings for current user/profile');
            return { success: true, synced: 0 };
        }

        let synced = 0;
        const failed = [];

        // Sync each pending rating
        for (const rating of toSync) {
            try {
                await saveCardRating(
                    rating.username,
                    rating.profileId,
                    rating.cardId,
                    rating.difficulty
                );
                synced++;
            } catch (error) {
                console.warn(`Failed to sync card ${rating.cardId}:`, error);
                failed.push(rating.cardId);
            }
        }

        // Remove successfully synced ratings from queue
        const updatedQueue = pending.filter(r => {
            // Keep if it's not in the "to sync" list, or if it failed
            const wasInToSync = toSync.find(s => s.cardId === r.cardId && s.profileId === r.profileId);
            return !wasInToSync || failed.includes(r.cardId);
        });

        localStorage.setItem('juice_pending_ratings', JSON.stringify(updatedQueue));

        const result = {
            success: failed.length === 0,
            synced: synced,
            failed: failed.length,
            remainingInQueue: updatedQueue.length
        };

        console.log(`Sync complete: ${synced} synced, ${failed.length} failed, ${updatedQueue.length} remaining`);
        return result;
    } catch (error) {
        console.error('Error syncing pending ratings:', error);
        return { success: false, synced: 0, error: error.message };
    }
}

/**
 * Clear the pending ratings queue (for testing/reset)
 */
function clearPendingRatings() {
    try {
        localStorage.removeItem('juice_pending_ratings');
        console.log('Pending ratings queue cleared');
        return true;
    } catch (error) {
        console.error('Error clearing pending ratings:', error);
        return false;
    }
}

// Admin functions
async function getAllUsers() {
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const users = [];

        for (const userDoc of querySnapshot.docs) {
            const userData = userDoc.data();
            let level = 'N/A';
            let xp = 0;
            let accuracy = 'N/A';
            let lastActive = 'N/A';

            // Try to load user's first profile for stats
            try {
                const profilesRef = collection(userDoc.ref, 'profiles');
                const profilesSnap = await getDocs(profilesRef);

                if (profilesSnap.docs.length > 0) {
                    const profileData = profilesSnap.docs[0].data();
                    level = profileData.currentLevel || 1;
                    xp = profileData.xp || 0;

                    // Calculate accuracy from profile
                    const total = profileData.totalCards || 0;
                    const correct = profileData.correctCards || 0;
                    if (total > 0) {
                        accuracy = (correct / total) * 100;
                    }

                    lastActive = profileData.lastStudy || userData.createdAt || new Date().toISOString();
                }
            } catch (err) {
                // If profiles don't exist, just use defaults
                console.warn('Could not load profile for user:', userDoc.id);
            }

            users.push({
                username: userDoc.id,
                isAdmin: userData.isAdmin || false,
                createdAt: userData.createdAt || new Date().toISOString(),
                lastActive: lastActive,
                level: level,
                xp: xp,
                accuracy: typeof accuracy === 'number' ? accuracy : null,
                pin: '****' // Never expose PIN
            });
        }

        return users;
    } catch (error) {
        console.error('Error loading users:', error);
        throw error;
    }
}

async function isUserAdmin(username) {
    try {
        const userRef = doc(db, 'users', username);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return false;
        }

        return userSnap.data().isAdmin || false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

async function createAdminAccount(username, pin) {
    try {
        // Check if username already exists
        const userRef = doc(db, 'users', username);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            throw new Error('Username already exists');
        }

        // Validate input
        if (!/^[a-zA-Z0-9]{2,20}$/.test(username)) {
            throw new Error('Username must be 2-20 alphanumeric characters');
        }

        if (!/^\d{4}$/.test(pin)) {
            throw new Error('PIN must be exactly 4 digits');
        }

        // Hash PIN before storing
        const pinHash = await hashPin(pin);

        // Create new admin user
        await setDoc(userRef, {
            username: username,
            pinHash: pinHash,  // Use hashed PIN for security
            isAdmin: true,
            createdAt: new Date().toISOString(),
            isActive: true
        });

        console.log('Admin account created successfully:', username);
        return true;
    } catch (error) {
        console.error('Error creating admin account:', error);
        throw error;
    }
}

async function resetUserPIN(username, newPin) {
    try {
        // Validate PIN
        if (!/^\d{4}$/.test(newPin)) {
            throw new Error('PIN must be exactly 4 digits');
        }

        // Hash PIN before storing
        const pinHash = await hashPin(newPin);

        const userRef = doc(db, 'users', username);
        await updateDoc(userRef, {
            pinHash: pinHash,  // Use hashed PIN for security
            pin: null,  // Remove old plain text PIN field
            pinResetAt: new Date().toISOString()
        });

        console.log('PIN reset for user:', username);
        return true;
    } catch (error) {
        console.error('Error resetting PIN:', error);
        throw error;
    }
}

async function deleteUser(username) {
    try {
        const userRef = doc(db, 'users', username);

        // Delete all subcollections (profiles and their card history)
        const profilesRef = collection(userRef, 'profiles');
        const profilesSnap = await getDocs(profilesRef);

        for (const profileDoc of profilesSnap.docs) {
            // Delete card history subcollection
            const cardHistoryRef = collection(profileDoc.ref, 'cardHistory');
            const cardHistorySnap = await getDocs(cardHistoryRef);

            for (const cardDoc of cardHistorySnap.docs) {
                await deleteDoc(cardDoc.ref);
            }

            // Delete the profile document
            await deleteDoc(profileDoc.ref);
        }

        // Delete the user document
        await deleteDoc(userRef);

        console.log('User deleted:', username);
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

async function deleteUserProgress(username, profileId) {
    try {
        const cardHistoryRef = collection(db, 'users', username, 'profiles', profileId, 'cardHistory');
        const cardHistorySnap = await getDocs(cardHistoryRef);

        // Delete all card history documents
        for (const doc of cardHistorySnap.docs) {
            await deleteDoc(doc.ref);
        }

        console.log('User progress deleted for:', username);
        return true;
    } catch (error) {
        console.error('Error deleting user progress:', error);
        throw error;
    }
}

/**
 * Get all available categories
 * @returns {array} - Array of category objects: { categoryId, name, description, cardSetCount, createdAt }
 */
async function getCategories() {
    try {
        if (!db) {
            throw new Error('Firebase not initialized');
        }

        const categoriesRef = collection(db, 'categories');
        const querySnapshot = await getDocs(categoriesRef);

        const categories = [];
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            categories.push({
                categoryId: docSnapshot.id,
                name: data.name,
                description: data.description || '',
                cardSetCount: data.cardSetCount || 0,
                createdAt: data.createdAt,
                createdBy: data.createdBy
            });
        });

        console.log('Categories loaded:', categories.length);
        return categories;
    } catch (error) {
        console.error('Error loading categories:', error);
        throw error;
    }
}

/**
 * Save a new category
 * @param {string} categoryId - Unique identifier for the category (lowercase, no spaces)
 * @param {object} categoryData - Category data: { name, description }
 * @returns {object} - { success: boolean, categoryId: string, message: string }
 */
async function saveCategory(categoryId, categoryData) {
    try {
        if (!db) {
            throw new Error('Firebase not initialized');
        }

        // Validate required fields
        if (!categoryId || !categoryData.name) {
            throw new Error('Invalid category data: missing ID or name');
        }

        // Validate category ID format
        if (!/^[a-z0-9-]+$/.test(categoryId)) {
            throw new Error('Category ID must be lowercase with only letters, numbers, and hyphens');
        }

        // Create category document
        const categoryRef = doc(db, 'categories', categoryId);

        const categoryDoc = {
            name: categoryData.name,
            description: categoryData.description || '',
            cardSetCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: categoryData.createdBy || 'admin'
        };

        await setDoc(categoryRef, categoryDoc);

        console.log('Category saved:', categoryId, categoryData.name);
        return {
            success: true,
            categoryId: categoryId,
            message: `Category "${categoryData.name}" created successfully`
        };
    } catch (error) {
        console.error('Error saving category:', error);
        throw error;
    }
}

/**
 * Update a category
 * @param {string} categoryId - ID of the category to update
 * @param {object} updates - Fields to update: { name, description }
 * @returns {object} - { success: boolean, message: string }
 */
async function updateCategory(categoryId, updates) {
    try {
        if (!db) {
            throw new Error('Firebase not initialized');
        }

        if (!categoryId) {
            throw new Error('Category ID is required');
        }

        const categoryRef = doc(db, 'categories', categoryId);
        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await updateDoc(categoryRef, updateData);

        console.log('Category updated:', categoryId);
        return {
            success: true,
            message: `Category "${updates.name || categoryId}" updated successfully`
        };
    } catch (error) {
        console.error('Error updating category:', error);
        throw error;
    }
}

/**
 * Delete a category
 * @param {string} categoryId - ID of the category to delete
 * @returns {object} - { success: boolean, message: string }
 */
async function deleteCategory(categoryId) {
    try {
        if (!db) {
            throw new Error('Firebase not initialized');
        }

        if (!categoryId) {
            throw new Error('Category ID is required');
        }

        const categoryRef = doc(db, 'categories', categoryId);
        await deleteDoc(categoryRef);

        console.log('Category deleted:', categoryId);
        return {
            success: true,
            message: `Category "${categoryId}" deleted successfully`
        };
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
}

/**
 * Save a card set to Firestore
 * @param {string} setId - Unique identifier for the card set
 * @param {object} setData - Card set data: { name, category, description, cards[], uploadedBy }
 * @returns {object} - { success: boolean, setId: string, message: string }
 */
async function saveCardSet(setId, setData) {
    try {
        if (!db) {
            throw new Error('Firebase not initialized');
        }

        // Validate required fields
        if (!setId || !setData.name || !setData.cards || !Array.isArray(setData.cards)) {
            throw new Error('Invalid card set data: missing name or cards array');
        }

        // Create card set document
        const cardSetRef = doc(db, 'cardSets', setId);

        const cardSetDoc = {
            name: setData.name,
            category: setData.category || 'uncategorized',
            description: setData.description || '',
            cardCount: setData.cards.length,
            cards: setData.cards,
            uploadedBy: setData.uploadedBy || 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await setDoc(cardSetRef, cardSetDoc);

        console.log('Card set saved:', setId, cardSetDoc.cardCount, 'cards');
        return {
            success: true,
            setId: setId,
            message: `Card set "${setData.name}" saved successfully with ${setData.cards.length} cards`
        };
    } catch (error) {
        console.error('Error saving card set:', error);
        throw error;
    }
}

/**
 * Get all available card sets
 * @returns {array} - Array of card set objects: { setId, name, category, description, cardCount, createdAt }
 */
async function getCardSets() {
    try {
        if (!db) {
            throw new Error('Firebase not initialized');
        }

        const cardSetsRef = collection(db, 'cardSets');
        const querySnapshot = await getDocs(cardSetsRef);

        const cardSets = [];
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            cardSets.push({
                setId: docSnapshot.id,
                name: data.name,
                category: data.category,
                description: data.description,
                cardCount: data.cardCount,
                createdAt: data.createdAt,
                uploadedBy: data.uploadedBy,
                cards: data.cards || []  // Include cards array
            });
        });

        console.log('Card sets loaded:', cardSets.length);
        return cardSets;
    } catch (error) {
        console.error('Error loading card sets:', error);
        throw error;
    }
}

/**
 * Delete a card set from Firestore
 * @param {string} setId - ID of the card set to delete
 * @returns {object} - { success: boolean, message: string }
 */
async function deleteCardSet(setId) {
    try {
        if (!db) {
            throw new Error('Firebase not initialized');
        }

        if (!setId) {
            throw new Error('Card set ID is required');
        }

        const cardSetRef = doc(db, 'cardSets', setId);
        await deleteDoc(cardSetRef);

        console.log('Card set deleted:', setId);
        return {
            success: true,
            message: `Card set "${setId}" deleted successfully`
        };
    } catch (error) {
        console.error('Error deleting card set:', error);
        throw error;
    }
}

// Export functions for use in index.html
window.JuiceAuth = {
    initializeFirebase,
    signUp,
    signIn,
    signOut,
    changePin,
    isLoggedIn,
    getCurrentSession,
    saveProfilesToCloud,
    syncProfilesFromCloud,
    saveCardRating,
    loadCardHistories,
    queueCardRating,
    getPendingRatings,
    syncPendingRatings,
    clearPendingRatings,
    getAllUsers,
    isUserAdmin,
    createAdminAccount,
    resetUserPIN,
    deleteUser,
    deleteUserProgress,
    saveCardSet,
    getCardSets,
    deleteCardSet,
    getCategories,
    saveCategory,
    updateCategory,
    deleteCategory
};
