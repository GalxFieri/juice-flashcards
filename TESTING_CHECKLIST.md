# Testing Checklist - Juice Flashcards Web App

## Pre-Launch Verification

Use this checklist to verify everything works before using with your team.

### 1. File Verification

- [ ] `index.html` exists (33 KB)
- [ ] `juice_cloze_import_UPDATED.csv` exists (21 KB)
- [ ] `answer-validation.js` exists (16 KB)
- [ ] `load-cards.js` exists (1.5 KB)
- [ ] `profile-system.js` exists (14 KB)
- [ ] All files in `D:\Custom_Web_app\`

### 2. Initial Load

- [ ] Open `index.html` in browser
- [ ] No console errors (press F12 to check)
- [ ] Profile selection screen appears
- [ ] Header shows "Juice Training"
- [ ] Text says "Select or create a profile"

### 3. Profile Creation

- [ ] Input field accepts text entry
- [ ] Can type name (e.g., "John")
- [ ] "Create" button is visible
- [ ] Clicking "Create" adds profile to list
- [ ] New profile shows in list below
- [ ] Profile shows format: Name, Level, XP, Card Count

### 4. Profile Selection

- [ ] Existing profiles appear as clickable buttons
- [ ] Can click on a profile
- [ ] Clicking profile starts study session
- [ ] Study screen appears with flip card

### 5. Study Screen - Front Card

- [ ] Front card has blue/purple gradient
- [ ] Card shows "Question" label at top
- [ ] Cloze text displays
- [ ] One blank shows as "\_\_\_\_\_" (with dashed border)
- [ ] Other answers shown in gold highlight
- [ ] Input field appears for answer
- [ ] Placeholder text: "Type your answer..."
- [ ] Text "Tap to flip" appears below input

### 6. Answer Input

- [ ] Can click in input field
- [ ] Can type text
- [ ] Input accepts keyboard text
- [ ] Can press Enter key
- [ ] Input shows entered text

### 7. Card Flip Animation

- [ ] Can tap anywhere on card to flip
- [ ] Card rotates 180 degrees
- [ ] Animation is smooth (not jerky)
- [ ] Animation takes ~0.6 seconds
- [ ] Back card (pink/coral) appears after flip
- [ ] Back card is readable

### 8. Study Screen - Back Card

- [ ] Back card has pink/coral gradient
- [ ] Shows "Answer" label at top
- [ ] Complete answer displays with all blanks filled
- [ ] Filled answers shown in green highlight
- [ ] "Your Answer vs. Expected" section appears
- [ ] Shows your answer on left
- [ ] Shows expected answer on right
- [ ] Divider line between sections

### 9. Answer Validation

- [ ] Feedback message appears
- [ ] Message color matches feedback type:
  - [ ] Green = "✓ Perfect! Exact match."
  - [ ] Yellow = "~ Close! (Minor differences)"
  - [ ] Orange = "≈ Acceptable (Check spelling)"
  - [ ] Red = "✗ Not quite. Try again!"
  - [ ] Dark Red = "🚫 These are DIFFERENT flavors!"

### 10. Rating Buttons

- [ ] Four buttons visible: Again, Hard, Good, Easy
- [ ] Each shows emoji icon
- [ ] Each shows time estimate (1m, 10m, 3d, 4d)
- [ ] Buttons have distinct colors
- [ ] Buttons are clickable
- [ ] Can tap any button

### 11. Rating Response

After tapping a rating button:
- [ ] Next card displays
- [ ] Card flips back to front (blue/purple)
- [ ] Input field clears
- [ ] New question appears
- [ ] Previous card state forgotten

### 12. XP System

- [ ] Footer shows current XP
- [ ] Footer shows current Level
- [ ] XP increases after each card
- [ ] Level updates when XP crosses 100
- [ ] Bonus applied for "Good" rating (1.25x)
- [ ] Bonus applied for "Easy" rating (1.5x)

### 13. Footer Information

- [ ] Profile name displays
- [ ] Current level displays
- [ ] Current XP displays
- [ ] "Back" button visible
- [ ] Footer stays visible while studying

### 14. Back to Profile Button

- [ ] "Back" button at bottom right
- [ ] Clicking "Back" returns to profile screen
- [ ] Profile list shows updated stats
- [ ] Can select same profile again
- [ ] Can select different profile

### 15. Data Persistence

- [ ] Close browser completely
- [ ] Reopen `index.html`
- [ ] Profile still exists
- [ ] XP/Level still there
- [ ] Study history remembered
- [ ] Cards still available

### 16. Multiple Cards

- [ ] Can study multiple cards (at least 10)
- [ ] Each card is different
- [ ] Each card advances correctly
- [ ] No cards repeat during session
- [ ] Can complete session

### 17. Mobile Responsiveness

**On small screens (mobile/tablet):**
- [ ] All content visible
- [ ] No horizontal scrolling needed
- [ ] Buttons are large enough to tap
- [ ] Text is readable
- [ ] Animation still smooth
- [ ] Layout adjusts to screen size

### 18. Touch Interaction

**On touchscreen:**
- [ ] Input field focuses on tap
- [ ] Cards flip on tap
- [ ] Buttons activate on tap
- [ ] No lag or delay
- [ ] Multi-touch not interfering

### 19. Browser Compatibility

Test in each browser:

**Chrome Desktop**
- [ ] Loads correctly
- [ ] All features work
- [ ] Animation smooth

**Firefox Desktop**
- [ ] Loads correctly
- [ ] All features work
- [ ] Animation smooth

**Safari Desktop**
- [ ] Loads correctly
- [ ] All features work
- [ ] Animation smooth

**Safari Mobile (iOS)**
- [ ] Loads correctly
- [ ] All features work
- [ ] Animation very smooth
- [ ] Touch controls responsive

**Chrome Mobile (Android)**
- [ ] Loads correctly
- [ ] All features work
- [ ] Animation smooth

### 20. CSV Data Loading

- [ ] CSV file loads on first visit
- [ ] All cards available
- [ ] Cloze format recognized
- [ ] Multiple blanks work (c1, c2, c3)
- [ ] No duplicate cards shown

### 21. Error Handling

- [ ] No JavaScript errors in console
- [ ] No network errors
- [ ] No storage warnings
- [ ] Graceful fallbacks if features unavailable
- [ ] App continues to work

### 22. Performance

- [ ] Page loads in <1 second
- [ ] Card flip animation is 60 FPS
- [ ] No lag when clicking buttons
- [ ] Memory usage reasonable
- [ ] Battery drain minimal

### 23. Accessibility

- [ ] Can use without mouse (keyboard only)
- [ ] Can use without vision (screen reader)
- [ ] Buttons clearly labeled
- [ ] Sufficient color contrast
- [ ] Touch targets 44px+ minimum

### 24. Special Cases

- [ ] Creating duplicate profile names works
- [ ] Entering empty name shows error
- [ ] Very long names handled
- [ ] Special characters in names work
- [ ] Numbers and symbols accepted

### 25. Advanced Features

**Fuzzy Matching**
- [ ] "strawbery" accepted for "strawberry"
- [ ] "orange" accepted for "oragne"
- [ ] "blueberrys" accepted for "blueberry"
- [ ] Typos with 1-2 character differences work

**Flavor Distinction**
- [ ] "blueberry" rejected if answer is "blue raspberry"
- [ ] "blue raspberry" rejected if answer is "blueberry"
- [ ] Shows "DIFFERENT flavors" message

**Exact Match**
- [ ] "strawberry" gives "Perfect!" for "strawberry"
- [ ] Case-insensitive ("STRAWBERRY" works)
- [ ] Whitespace trimmed ("  strawberry  " works)

## Sign-Off

When all items are checked:

- [ ] App is ready for production
- [ ] No known issues
- [ ] All features working
- [ ] Mobile optimized
- [ ] Data persistent
- [ ] User experience excellent

**Tester Name**: _______________

**Date**: _______________

**Notes**:

```
[Any issues or observations]
```

**Overall Status**:
- [ ] ✅ PASS - Ready to use
- [ ] ⚠️  CONDITIONAL PASS - Works but with limitations
- [ ] ❌ FAIL - Not ready

---

## Troubleshooting During Testing

### Issue: Page won't load
**Fix**:
1. Check file path is correct
2. Try different browser
3. Clear browser cache (Ctrl+Shift+Delete)
4. Restart browser

### Issue: No cards appear
**Fix**:
1. Check CSV file exists in same directory
2. Open browser console (F12)
3. Look for error messages
4. Try: `localStorage.clear()` and refresh

### Issue: Buttons don't work
**Fix**:
1. Check if JavaScript is enabled
2. Open console to see errors
3. Try different browser
4. Reload page

### Issue: Animation is choppy
**Fix**:
1. Normal on older devices
2. Close other applications
3. Try different browser
4. Check GPU acceleration is enabled

### Issue: Data disappears
**Fix**:
1. Check browser hasn't cleared storage
2. Try incognito/private mode
3. Check cookies are enabled
4. Try different browser

### Issue: Mobile layout broken
**Fix**:
1. Zoom to 100% (not zoomed in/out)
2. Rotate device
3. Try full-screen mode
4. Check browser zoom settings

---

**Testing Duration**: 30-60 minutes
**Difficulty**: Easy (no technical knowledge needed)
**Recommendation**: Run through full checklist before first use

Good luck! 🎓
