/**
 * Answer Validation Module for Juice Flashcards
 * Handles fuzzy matching, flavor distinction, and answer comparison
 *
 * Features:
 * - Levenshtein distance algorithm for typo tolerance
 * - Flavor-specific validation (Blueberry ≠ Blue Raspberry)
 * - Common spelling variations handling
 * - Case-insensitive matching
 * - Whitelist/blacklist support
 */

const AnswerValidation = (function() {
    'use strict';

    // ====================================================
    // FLAVOR WHITELIST & BLACKLIST
    // ====================================================

    /**
     * Flavor profiles that must NOT be confused with each other
     * These are critical for store training
     */
    const FLAVOR_DISTINCTIONS = {
        'blueberry': {
            forbidden: ['blue raspberry', 'blueberries'],
            aliases: ['blue berry']
        },
        'blue raspberry': {
            forbidden: ['blueberry', 'blueberries'],
            aliases: ['blue razz', 'blue rasp']
        },
        'strawberry': {
            forbidden: ['strawberry jam'],
            aliases: ['straw berry']
        },
        'strawberry jam': {
            forbidden: ['strawberry'],
            aliases: ['strawb jam', 'strawberry preserve']
        }
    };

    /**
     * Common spelling variations that should be accepted
     * Format: { correct: ['variant1', 'variant2', ...] }
     */
    const SPELLING_VARIATIONS = {
        'raspberry': ['rasberry', 'rapsberry', 'razberry'],
        'orange': ['orang', 'orrange'],
        'pineapple': ['pineapple', 'pine apple'],
        'watermelon': ['water melon', 'watermellon'],
        'blueberry': ['blue berry', 'blueberrie'],
        'strawberry': ['straw berry', 'strawberrie'],
        'blackberry': ['black berry', 'blackberrie'],
        'cranberry': ['cran berry', 'cranberrie'],
        'lemonade': ['lemon ade', 'lemonde'],
        'limeade': ['lime ade', 'limade'],
        'tamarind': ['tamarin', 'tamarindo'],
        'hibiscus': ['hibiscus', 'hibiscus'],
        'guava': ['guava', 'guwa'],
        'mango': ['mango', 'mangoes'],
        'coconut': ['cocnut', 'coco nut'],
        'kiwi': ['kiwi', 'kiwifruit'],
        'peach': ['peach', 'peachy'],
        'apricot': ['apricot', 'apricots'],
        'cherry': ['cherry', 'cherries'],
        'custard': ['custerd', 'custurd'],
        'caramel': ['carmel', 'caramell'],
        'toffee': ['tofee', 'toffy'],
        'vanilla': ['vanila', 'vanille'],
        'cinnamon': ['cinamon', 'cinniman'],
        'menthol': ['menthel', 'menthol'],
        'peppermint': ['peper mint', 'pepermint'],
        'spearmint': ['spear mint', 'spearmint']
    };

    // ====================================================
    // LEVENSHTEIN DISTANCE ALGORITHM
    // ====================================================

    /**
     * Calculate Levenshtein distance between two strings
     * Measures minimum edit operations (insert, delete, substitute)
     *
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} - Distance value
     */
    function levenshteinDistance(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = [];

        // Initialize matrix
        for (let i = 0; i <= len2; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len1; j++) {
            matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= len2; i++) {
            for (let j = 1; j <= len1; j++) {
                const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }

        return matrix[len2][len1];
    }

    /**
     * Calculate similarity between two strings (0 to 1)
     * 1.0 = identical, 0.0 = completely different
     *
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} - Similarity ratio (0-1)
     */
    function calculateSimilarity(str1, str2) {
        const distance = levenshteinDistance(str1, str2);
        const maxLen = Math.max(str1.length, str2.length);
        return maxLen === 0 ? 1.0 : 1 - (distance / maxLen);
    }

    // ====================================================
    // FLAVOR DISTINCTION VALIDATION
    // ====================================================

    /**
     * Check if answer violates critical flavor distinctions
     * Returns true if this is a forbidden confusion
     *
     * @param {string} userAnswer - User's answer
     * @param {string} correctAnswer - Expected answer
     * @returns {object} - { isForbidden: boolean, reason: string }
     */
    function checkFlavorDistinction(userAnswer, correctAnswer) {
        const userNorm = userAnswer.trim().toLowerCase();
        const correctNorm = correctAnswer.trim().toLowerCase();

        // Check if correct answer has forbidden variations
        if (FLAVOR_DISTINCTIONS[correctNorm]) {
            const forbidden = FLAVOR_DISTINCTIONS[correctNorm].forbidden;
            for (const forbiddenFlavor of forbidden) {
                if (userNorm.includes(forbiddenFlavor) ||
                    forbiddenFlavor.includes(userNorm)) {
                    return {
                        isForbidden: true,
                        reason: `"${userAnswer}" and "${correctAnswer}" are DIFFERENT flavors - store training critical!`
                    };
                }
            }
        }

        return { isForbidden: false, reason: null };
    }

    // ====================================================
    // SPELLING VARIATION HANDLING
    // ====================================================

    /**
     * Normalize spelling variations to standard form
     * Handles common typos and spacing issues
     *
     * @param {string} text - Text to normalize
     * @returns {string} - Normalized text
     */
    function normalizeSpelling(text) {
        let normalized = text.trim().toLowerCase();

        // Check each spelling variation
        for (const [correct, variations] of Object.entries(SPELLING_VARIATIONS)) {
            for (const variant of variations) {
                const variantRegex = new RegExp('\\b' + variant + '\\b', 'gi');
                normalized = normalized.replace(variantRegex, correct);
            }
        }

        return normalized;
    }

    /**
     * Check if answer matches using spelling variations
     *
     * @param {string} userAnswer - User's answer
     * @param {string} correctAnswer - Expected answer
     * @returns {boolean} - True if matches considering variations
     */
    function matchesWithVariations(userAnswer, correctAnswer) {
        const userNorm = normalizeSpelling(userAnswer);
        const correctNorm = normalizeSpelling(correctAnswer);
        return userNorm === correctNorm;
    }

    // ====================================================
    // ANSWER COMPARISON & FEEDBACK
    // ====================================================

    /**
     * Compare user answer with correct answer
     * Returns detailed feedback about match quality
     *
     * @param {string} userAnswer - User's typed answer
     * @param {string} correctAnswer - Expected/correct answer
     * @param {object} options - Configuration options
     * @returns {object} - { status, similarity, feedback, award }
     */
    function compareAnswers(userAnswer, correctAnswer, options = {}) {
        const {
            perfectThreshold = 1.0,      // Exact match = perfect
            closeThreshold = 0.85,       // 85%+ = close match
            acceptThreshold = 0.80,      // 80%+ = acceptable
            strictFlavors = true,        // Enforce flavor distinctions
            logDetails = false
        } = options;

        // Empty answer check
        if (!userAnswer || !userAnswer.trim()) {
            return {
                status: 'empty',
                similarity: 0,
                feedback: '❌ No answer provided',
                award: 0
            };
        }

        const userNorm = userAnswer.trim().toLowerCase();
        const correctNorm = correctAnswer.trim().toLowerCase();

        // Log details if enabled
        if (logDetails) {
            console.log('Answer Validation Details:');
            console.log('  User:', userAnswer);
            console.log('  Correct:', correctAnswer);
        }

        // ====================================================
        // STAGE 1: EXACT MATCH
        // ====================================================
        if (userNorm === correctNorm) {
            if (logDetails) console.log('  Result: PERFECT (exact match)');
            return {
                status: 'perfect',
                similarity: 1.0,
                feedback: '✓ Perfect! Exact match.',
                award: 100  // Full XP
            };
        }

        // ====================================================
        // STAGE 2: FLAVOR DISTINCTION CHECK (CRITICAL)
        // ====================================================
        if (strictFlavors) {
            const flavorCheck = checkFlavorDistinction(userAnswer, correctAnswer);
            if (flavorCheck.isForbidden) {
                if (logDetails) console.log('  Result: FORBIDDEN CONFUSION');
                return {
                    status: 'forbidden',
                    similarity: 0,
                    feedback: '🚫 ' + flavorCheck.reason,
                    award: 0  // No points for flavor confusion
                };
            }
        }

        // ====================================================
        // STAGE 3: SPELLING VARIATIONS
        // ====================================================
        if (matchesWithVariations(userAnswer, correctAnswer)) {
            if (logDetails) console.log('  Result: CLOSE (spelling variation)');
            return {
                status: 'close_spelling',
                similarity: 0.95,
                feedback: '~ Close! Spelling variation accepted.',
                award: 75  // 75% XP for spelling variation
            };
        }

        // ====================================================
        // STAGE 4: FUZZY MATCHING (LEVENSHTEIN)
        // ====================================================
        const similarity = calculateSimilarity(userNorm, correctNorm);

        if (similarity >= perfectThreshold) {
            if (logDetails) console.log('  Result: PERFECT (fuzzy)');
            return {
                status: 'perfect',
                similarity: similarity,
                feedback: '✓ Perfect!',
                award: 100
            };
        }

        if (similarity >= closeThreshold) {
            if (logDetails) console.log('  Result: CLOSE (fuzzy match at ' + (similarity * 100).toFixed(0) + '%)');
            return {
                status: 'close',
                similarity: similarity,
                feedback: `~ Close! Minor differences (${(similarity * 100).toFixed(0)}% match).`,
                award: 75  // 75% XP for close match
            };
        }

        if (similarity >= acceptThreshold) {
            if (logDetails) console.log('  Result: ACCEPTABLE (fuzzy match at ' + (similarity * 100).toFixed(0) + '%)');
            return {
                status: 'acceptable',
                similarity: similarity,
                feedback: `≈ Acceptable (${(similarity * 100).toFixed(0)}% match), but check spelling.`,
                award: 50  // 50% XP for acceptable match
            };
        }

        // ====================================================
        // STAGE 5: NO MATCH
        // ====================================================
        if (logDetails) console.log('  Result: INCORRECT (fuzzy match at ' + (similarity * 100).toFixed(0) + '%)');
        return {
            status: 'incorrect',
            similarity: similarity,
            feedback: '✗ Not quite. Try again!',
            award: 0
        };
    }

    // ====================================================
    // HIERARCHICAL CATEGORY MATCHING (for Reverse Cards)
    // ====================================================

    /**
     * Detect the matching level required based on question specificity
     * Analyzes question keywords to determine which category hierarchy level to use
     *
     * @param {string} question - The question text to analyze
     * @returns {string} - 'primary', 'secondary', or 'tertiary'
     */
    function detectMatchingLevel(question) {
        if (!question) return 'primary';

        const questionLower = question.toLowerCase();

        // Tertiary level keywords (most specific)
        const tertiaryKeywords = [
            'cereal', 'chocolate', 'bakery', 'pastry', 'citrus', 'melon',
            'menthol', 'candy', 'confection', 'caramel', 'vanilla', 'cream',
            'butter', 'donut', 'cake', 'custard', 'milk', 'cherry', 'peach',
            'herb', 'herbal', 'tobacco'
        ];

        // Secondary level keywords (medium specificity)
        const secondaryKeywords = [
            'creamy', 'fruity', 'sweet', 'tart', 'sour', 'minty', 'bold',
            'berry', 'fruit', 'tropical', 'dessert'
        ];

        // Quaternary level keywords (most specific qualitative descriptors)
        const quaternaryKeywords = [
            'warm', 'cool', 'smooth', 'crisp', 'pure', 'exotic', 'herbal',
            'simple', 'clean', 'classic', 'rich'
        ];

        // Count keyword matches
        let tertiaryCount = 0;
        for (const keyword of tertiaryKeywords) {
            if (questionLower.includes(keyword)) tertiaryCount++;
        }

        let secondaryCount = 0;
        for (const keyword of secondaryKeywords) {
            if (questionLower.includes(keyword)) secondaryCount++;
        }

        // Determine matching level based on keyword counts
        if (tertiaryCount >= 2) {
            return 'tertiary';
        } else if (tertiaryCount === 1 || secondaryCount >= 2) {
            return 'secondary';
        } else {
            return 'primary';
        }
    }

    /**
     * Get product categories from the product database
     * Returns null if product not found
     *
     * @param {string} productName - Name of the product to look up
     * @param {array} productDatabase - Array of product category objects
     * @returns {object|null} - { primary, secondary, tertiary, quaternary } or null
     */
    function getProductCategories(productName, productDatabase) {
        if (!productDatabase || !Array.isArray(productDatabase)) {
            return null;
        }

        const productNorm = productName.trim().toLowerCase();

        for (const product of productDatabase) {
            if (product['Product Name'] &&
                product['Product Name'].trim().toLowerCase() === productNorm) {
                return {
                    primary: product['Primary Category'] || null,
                    secondary: product['Secondary Category'] || null,
                    tertiary: product['Tertiary Category'] || null,
                    quaternary: product['Quaternary Category'] || null
                };
            }
        }

        return null;
    }

    /**
     * Check if two products share categories at the specified matching level
     * Returns whether they match at that level and which categories are shared
     *
     * @param {object} userCategories - Categories of user's answer product
     * @param {object} expectedCategories - Categories of expected answer product
     * @param {string} matchLevel - 'primary', 'secondary', or 'tertiary'
     * @returns {object} - { matched: boolean, shared: [array of category names] }
     */
    function checkCategoryMatch(userCategories, expectedCategories, matchLevel) {
        if (!userCategories || !expectedCategories) {
            return { matched: false, shared: [] };
        }

        const sharedCategories = [];

        if (matchLevel === 'primary') {
            // Primary level: only primary category must match
            if (userCategories.primary === expectedCategories.primary &&
                userCategories.primary) {
                sharedCategories.push(userCategories.primary);
                return { matched: true, shared: sharedCategories };
            }
        } else if (matchLevel === 'secondary') {
            // Secondary level: primary AND secondary must BOTH match
            if (userCategories.primary === expectedCategories.primary &&
                userCategories.primary &&
                userCategories.secondary === expectedCategories.secondary &&
                userCategories.secondary) {
                sharedCategories.push(userCategories.primary);
                sharedCategories.push(userCategories.secondary);
                return { matched: true, shared: sharedCategories };
            }
        } else if (matchLevel === 'tertiary') {
            // Tertiary level: primary AND secondary must match
            // (Tertiary is considered but not required for match)
            if (userCategories.primary === expectedCategories.primary &&
                userCategories.primary &&
                userCategories.secondary === expectedCategories.secondary &&
                userCategories.secondary) {

                sharedCategories.push(userCategories.primary);
                sharedCategories.push(userCategories.secondary);

                if (userCategories.tertiary === expectedCategories.tertiary &&
                    userCategories.tertiary) {
                    sharedCategories.push(userCategories.tertiary);
                }

                return { matched: true, shared: sharedCategories };
            }
        }

        return { matched: false, shared: [] };
    }

    /**
     * Create a "no match" result object with proper feedback
     *
     * @param {string} expectedAnswer - The correct answer
     * @returns {object} - Standard result object
     */
    function createNoMatchResult(expectedAnswer) {
        return {
            status: 'incorrect',
            similarity: 0,
            feedback: `✗ Incorrect. The answer is ${expectedAnswer}`,
            award: 0,
            matchType: 'none',
            xpMultiplier: 1.0
        };
    }

    /**
     * Compare answers using hierarchical category matching
     * This is the main function for reverse card validation
     *
     * @param {string} userAnswer - User's typed answer
     * @param {string} expectedAnswer - Expected/correct answer
     * @param {string} question - The question being asked
     * @param {array} productDatabase - Pre-loaded product categories array
     * @param {object} options - Optional configuration
     * @returns {object} - Detailed comparison result with category matching
     */
    function compareAnswersWithHierarchicalCategory(userAnswer, expectedAnswer, question, productDatabase, options = {}) {
        const {
            perfectThreshold = 1.0,
            closeThreshold = 0.85,
            acceptThreshold = 0.80,
            strictFlavors = true,
            logDetails = false
        } = options;

        // Empty answer check
        if (!userAnswer || !userAnswer.trim()) {
            return {
                status: 'empty',
                similarity: 0,
                feedback: '❌ No answer provided',
                award: 0,
                matchType: 'none',
                xpMultiplier: 1.0
            };
        }

        // TIER 1: Try exact match first (always preferred)
        const exactResult = compareAnswers(userAnswer, expectedAnswer, options);

        if (exactResult.status !== 'incorrect' && exactResult.status !== 'forbidden' &&
            exactResult.status !== 'empty') {
            // Exact match found (perfect, close, or acceptable)
            return {
                ...exactResult,
                matchType: 'exact',
                xpMultiplier: 1.0
            };
        }

        // If no product database, fall back to exact matching only
        if (!productDatabase) {
            return {
                ...exactResult,
                matchType: 'none',
                xpMultiplier: 1.0
            };
        }

        // TIER 2: Category-based matching (only if exact match failed)

        // Detect question specificity level
        const matchLevel = detectMatchingLevel(question);
        if (logDetails) {
            console.log(`Category Matching - Detected level: ${matchLevel}`);
        }

        // Get categories for both answers
        const userAnswerCategories = getProductCategories(userAnswer, productDatabase);
        const expectedAnswerCategories = getProductCategories(expectedAnswer, productDatabase);

        if (!userAnswerCategories || !expectedAnswerCategories) {
            // One or both answers not in database, fall back to exact matching result
            return createNoMatchResult(expectedAnswer);
        }

        // Check for category match at the detected level
        const categoryMatch = checkCategoryMatch(
            userAnswerCategories,
            expectedAnswerCategories,
            matchLevel
        );

        if (categoryMatch.matched) {
            if (logDetails) {
                console.log(`Category Match Found! Shared categories: ${categoryMatch.shared.join(', ')}`);
            }

            // Category match is as good as exact match - full credit
            return {
                status: 'category_match',
                similarity: 1.0,
                feedback: `✓ Correct! ${userAnswer}`,
                award: 100,  // Full XP base
                matchType: 'category',
                xpMultiplier: 1.0,  // Full multipliers apply (×1.25, ×1.5)
                matchedLevel: matchLevel,
                sharedCategories: categoryMatch.shared
            };
        }

        // TIER 3: No match
        if (logDetails) {
            console.log(`No category match. User: ${JSON.stringify(userAnswerCategories)}, Expected: ${JSON.stringify(expectedAnswerCategories)}`);
        }

        return createNoMatchResult(expectedAnswer);
    }

    // ====================================================
    // DETAILED FEEDBACK MESSAGES
    // ====================================================

    /**
     * Get user-friendly feedback message based on comparison result
     *
     * @param {object} result - Result from compareAnswers()
     * @returns {string} - HTML-formatted feedback
     */
    function getFeedbackHTML(result) {
        const feedbackMap = {
            perfect: {
                icon: '✓',
                color: '#4CAF50',
                message: 'Perfect! You got it exactly right.'
            },
            close: {
                icon: '~',
                color: '#FFC107',
                message: 'Close! You\'re very close with minor spelling differences.'
            },
            close_spelling: {
                icon: '~',
                color: '#FFC107',
                message: 'Accepted! Spelling variation of correct answer.'
            },
            acceptable: {
                icon: '≈',
                color: '#FF9800',
                message: 'Acceptable match, but double-check your spelling.'
            },
            incorrect: {
                icon: '✗',
                color: '#FF6B6B',
                message: 'Not quite right. Study this one more carefully.'
            },
            forbidden: {
                icon: '🚫',
                color: '#F44336',
                message: 'Critical! These are different flavors.'
            },
            empty: {
                icon: '⚠️',
                color: '#FF9800',
                message: 'Please enter an answer.'
            }
        };

        const feedback = feedbackMap[result.status] || feedbackMap.incorrect;
        return `<span style="color: ${feedback.color}; font-weight: 600;">
                  ${feedback.icon} ${result.feedback}
                </span>`;
    }

    // ====================================================
    // PUBLIC API
    // ====================================================

    return {
        /**
         * Main comparison function
         * @param {string} userAnswer - User's answer
         * @param {string} correctAnswer - Expected answer
         * @param {object} options - Optional configuration
         * @returns {object} - Detailed comparison result
         */
        compare: compareAnswers,

        /**
         * Hierarchical category matching for reverse cards
         * @param {string} userAnswer - User's answer
         * @param {string} expectedAnswer - Expected answer
         * @param {string} question - The question being asked
         * @param {array} productDatabase - Product categories database
         * @param {object} options - Optional configuration
         * @returns {object} - Detailed comparison result with category matching
         */
        compareWithHierarchicalCategory: compareAnswersWithHierarchicalCategory,

        /**
         * Get HTML feedback
         * @param {object} result - Result from compare()
         * @returns {string} - HTML formatted feedback
         */
        getFeedback: getFeedbackHTML,

        /**
         * Utility: Check flavor distinction
         * @param {string} user - User answer
         * @param {string} correct - Correct answer
         * @returns {object} - Distinction check result
         */
        checkFlavor: checkFlavorDistinction,

        /**
         * Utility: Check spelling variations
         * @param {string} user - User answer
         * @param {string} correct - Correct answer
         * @returns {boolean} - Whether they match with variations
         */
        checkSpelling: matchesWithVariations,

        /**
         * Utility: Calculate raw similarity
         * @param {string} str1 - First string
         * @param {string} str2 - Second string
         * @returns {number} - Similarity 0-1
         */
        similarity: calculateSimilarity,

        /**
         * Utility: Normalize spelling
         * @param {string} text - Text to normalize
         * @returns {string} - Normalized text
         */
        normalize: normalizeSpelling,

        /**
         * Get flavor distinctions (read-only)
         * @returns {object} - Flavor distinction rules
         */
        getFlavors: () => ({ ...FLAVOR_DISTINCTIONS }),

        /**
         * Get spelling variations (read-only)
         * @returns {object} - Spelling variation rules
         */
        getVariations: () => ({ ...SPELLING_VARIATIONS })
    };
})();

// Export for use in templates
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnswerValidation;
}
