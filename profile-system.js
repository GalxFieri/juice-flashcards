/**
 * Profile System for Juice Flashcards
 * Handles per-user profiles, stats tracking, and data persistence
 *
 * Features:
 * - Multiple user profiles
 * - Per-profile stats (accuracy, study time, etc.)
 * - localStorage persistence
 * - Profile switching during session
 * - Profile creation/deletion
 * - Stats aggregation and reporting
 */

const ProfileSystem = (function() {
    'use strict';

    // ====================================================
    // CONFIGURATION
    // ====================================================

    const STORAGE_KEY = 'juice_profiles';
    const CURRENT_PROFILE_KEY = 'juice_current_profile';
    const VERSION = '1.0';

    // Default profile structure
    const DEFAULT_PROFILE = {
        id: null,           // UUID
        name: '',           // Profile name
        createdAt: null,    // Timestamp
        lastStudiedAt: null,
        stats: {
            totalCards: 0,
            correctCards: 0,
            incorrectCards: 0,
            totalStudyTime: 0,     // in seconds
            cardsSeen: 0,
            averageAccuracy: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalXP: 0,
            currentLevel: 1,
            sessionStats: {
                cardsToday: 0,
                correctToday: 0,
                xpToday: 0,
                sessionStartTime: null
            }
        }
    };

    // ====================================================
    // UTILITY FUNCTIONS
    // ====================================================

    /**
     * Generate unique ID
     * @returns {string}
     */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Deep clone object
     * @param {object} obj - Object to clone
     * @returns {object}
     */
    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Get all profiles from localStorage
     * @returns {object} - Map of profiles
     */
    function loadProfiles() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error loading profiles:', e);
            return {};
        }
    }

    /**
     * Save profiles to localStorage
     * @param {object} profiles - Profiles to save
     */
    function saveProfiles(profiles) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
        } catch (e) {
            console.error('Error saving profiles:', e);
            // Silently fail - localStorage might be full or disabled
        }
    }

    /**
     * Get current active profile ID
     * @returns {string|null}
     */
    function getCurrentProfileId() {
        try {
            return localStorage.getItem(CURRENT_PROFILE_KEY);
        } catch (e) {
            return null;
        }
    }

    /**
     * Set current active profile
     * @param {string} profileId
     */
    function setCurrentProfileId(profileId) {
        try {
            localStorage.setItem(CURRENT_PROFILE_KEY, profileId);
        } catch (e) {
            console.error('Error setting current profile:', e);
        }
    }

    // ====================================================
    // PROFILE MANAGEMENT
    // ====================================================

    /**
     * Create a new profile
     * @param {string} name - Profile name
     * @returns {object} - Created profile
     */
    function createProfile(name) {
        if (!name || name.trim().length === 0) {
            throw new Error('Profile name cannot be empty');
        }

        const profiles = loadProfiles();
        const profileId = generateId();
        const profile = deepClone(DEFAULT_PROFILE);

        profile.id = profileId;
        profile.name = name.trim();
        profile.createdAt = new Date().toISOString();

        profiles[profileId] = profile;
        saveProfiles(profiles);

        return profile;
    }

    /**
     * Get all profiles
     * @returns {array} - Array of profile objects
     */
    function getAllProfiles() {
        const profiles = loadProfiles();
        return Object.values(profiles).sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    /**
     * Get profile by ID
     * @param {string} profileId
     * @returns {object|null}
     */
    function getProfile(profileId) {
        const profiles = loadProfiles();
        return profiles[profileId] || null;
    }

    /**
     * Get current active profile
     * @returns {object|null}
     */
    function getCurrentProfile() {
        const profileId = getCurrentProfileId();
        return profileId ? getProfile(profileId) : null;
    }

    /**
     * Update profile name
     * @param {string} profileId
     * @param {string} newName
     * @returns {object} - Updated profile
     */
    function renameProfile(profileId, newName) {
        if (!newName || newName.trim().length === 0) {
            throw new Error('Profile name cannot be empty');
        }

        const profiles = loadProfiles();
        if (!profiles[profileId]) {
            throw new Error('Profile not found');
        }

        profiles[profileId].name = newName.trim();
        saveProfiles(profiles);
        return profiles[profileId];
    }

    /**
     * Delete a profile
     * @param {string} profileId
     * @returns {boolean}
     */
    function deleteProfile(profileId) {
        const profiles = loadProfiles();
        if (!profiles[profileId]) {
            throw new Error('Profile not found');
        }

        // Don't allow deleting if it's the current profile
        if (getCurrentProfileId() === profileId) {
            throw new Error('Cannot delete active profile');
        }

        delete profiles[profileId];
        saveProfiles(profiles);
        return true;
    }

    /**
     * Switch to a different profile
     * @param {string} profileId
     * @returns {object} - Switched profile
     */
    function switchProfile(profileId) {
        const profile = getProfile(profileId);
        if (!profile) {
            throw new Error('Profile not found');
        }

        setCurrentProfileId(profileId);
        return profile;
    }

    // ====================================================
    // STATS MANAGEMENT
    // ====================================================

    /**
     * Record a card result
     * @param {string} profileId
     * @param {object} result - { status, similarity, award }
     * @returns {object} - Updated profile
     */
    function recordCardResult(profileId, result) {
        const profiles = loadProfiles();
        const profile = profiles[profileId];

        if (!profile) {
            throw new Error('Profile not found');
        }

        const { status, award } = result;
        const stats = profile.stats;

        // Update card counts
        stats.totalCards++;
        stats.cardsSeen++;

        // Update result counts
        if (status === 'perfect' || status === 'close' || status === 'close_spelling') {
            stats.correctCards++;
            stats.currentStreak = (stats.currentStreak || 0) + 1;
        } else {
            stats.incorrectCards++;
            stats.currentStreak = 0;
        }

        // Update streak tracking
        if (stats.currentStreak > (stats.longestStreak || 0)) {
            stats.longestStreak = stats.currentStreak;
        }

        // Calculate accuracy
        stats.averageAccuracy = (stats.correctCards / stats.totalCards) * 100;

        // Award XP
        stats.totalXP += award;
        stats.sessionStats.xpToday += award;

        // Calculate level (100 XP = level 2, 200 XP = level 3, etc.)
        stats.currentLevel = Math.floor(stats.totalXP / 100) + 1;

        // Update last studied time
        profile.lastStudiedAt = new Date().toISOString();

        saveProfiles(profiles);
        return profile;
    }

    /**
     * Get profile statistics
     * @param {string} profileId
     * @returns {object} - Statistics object
     */
    function getStats(profileId) {
        const profile = getProfile(profileId);
        if (!profile) {
            throw new Error('Profile not found');
        }

        const stats = profile.stats;
        return {
            profileName: profile.name,
            totalCards: stats.totalCards,
            correctCards: stats.correctCards,
            incorrectCards: stats.incorrectCards,
            accuracy: stats.averageAccuracy.toFixed(1),
            totalStudyTime: formatTime(stats.totalStudyTime),
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
            totalXP: stats.totalXP,
            currentLevel: stats.currentLevel,
            nextLevelXP: stats.currentLevel * 100,
            xpProgress: stats.totalXP % 100,
            createdAt: profile.createdAt,
            lastStudied: profile.lastStudiedAt
        };
    }

    /**
     * Start a study session
     * @param {string} profileId
     * @returns {object} - Session info
     */
    function startSession(profileId) {
        const profiles = loadProfiles();
        const profile = profiles[profileId];

        if (!profile) {
            throw new Error('Profile not found');
        }

        profile.stats.sessionStats = {
            cardsToday: 0,
            correctToday: 0,
            xpToday: 0,
            sessionStartTime: new Date().toISOString()
        };

        saveProfiles(profiles);
        return profile.stats.sessionStats;
    }

    /**
     * End a study session
     * @param {string} profileId
     * @returns {object} - Session summary
     */
    function endSession(profileId) {
        const profile = getProfile(profileId);
        if (!profile) {
            throw new Error('Profile not found');
        }

        const session = profile.stats.sessionStats;
        const startTime = new Date(session.sessionStartTime);
        const endTime = new Date();
        const studyTime = Math.floor((endTime - startTime) / 1000); // seconds

        // Update total study time
        profile.stats.totalStudyTime += studyTime;

        return {
            cardsStudied: session.cardsToday,
            correctAnswers: session.correctToday,
            accuracy: session.cardsToday > 0 ?
                     ((session.correctToday / session.cardsToday) * 100).toFixed(1) : 0,
            xpEarned: session.xpToday,
            studyDuration: formatTime(studyTime),
            levelUp: profile.stats.currentLevel > Math.floor((profile.stats.totalXP - session.xpToday) / 100) + 1
        };
    }

    // ====================================================
    // UTILITY FUNCTIONS
    // ====================================================

    /**
     * Format seconds to readable time
     * @param {number} seconds
     * @returns {string}
     */
    function formatTime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${(seconds / 60).toFixed(0)}m`;
        return `${(seconds / 3600).toFixed(1)}h`;
    }

    /**
     * Export profile data as JSON
     * @param {string} profileId
     * @returns {string}
     */
    function exportProfile(profileId) {
        const profile = getProfile(profileId);
        if (!profile) {
            throw new Error('Profile not found');
        }

        return JSON.stringify(profile, null, 2);
    }

    /**
     * Import profile from JSON
     * @param {string} jsonData
     * @returns {object} - Imported profile
     */
    function importProfile(jsonData) {
        try {
            const importedProfile = JSON.parse(jsonData);

            // Validate structure
            if (!importedProfile.name) {
                throw new Error('Invalid profile structure');
            }

            // Generate new ID to avoid conflicts
            importedProfile.id = generateId();

            const profiles = loadProfiles();
            profiles[importedProfile.id] = importedProfile;
            saveProfiles(profiles);

            return importedProfile;
        } catch (e) {
            throw new Error('Error importing profile: ' + e.message);
        }
    }

    /**
     * Clear all data (WARNING: destructive)
     */
    function clearAllData() {
        if (confirm('Are you sure? This will delete ALL profiles and data. This cannot be undone.')) {
            try {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(CURRENT_PROFILE_KEY);
                return true;
            } catch (e) {
                console.error('Error clearing data:', e);
                return false;
            }
        }
        return false;
    }

    // ====================================================
    // PUBLIC API
    // ====================================================

    return {
        // Profile Management
        createProfile,
        getAllProfiles,
        getProfile,
        getCurrentProfile,
        renameProfile,
        deleteProfile,
        switchProfile,

        // Stats Management
        recordCardResult,
        getStats,
        startSession,
        endSession,

        // Utilities
        exportProfile,
        importProfile,
        clearAllData,
        formatTime
    };
})();

// Export for use in templates
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileSystem;
}
