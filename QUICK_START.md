# Quick Start Guide - Juice Flashcards Web App

## In 30 Seconds

1. **Open** `index.html` in your browser (iOS Safari, Chrome, or Firefox)
2. **Create** a profile by entering your name
3. **Study** by tapping cards to flip them
4. **Rate** with custom buttons - earn XP and level up!

## Step-by-Step Setup

### Step 1: Prepare Files
All files you need are already in `D:\Custom_Web_app\`:
- ✅ `index.html` - The app
- ✅ `juice_cloze_import_UPDATED.csv` - 100+ juice cards
- ✅ `answer-validation.js` - Answer checking logic
- ✅ `load-cards.js` - CSV loader
- ✅ `profile-system.js` - Profile system (ready for future use)

### Step 2: Open in Browser

**On Desktop:**
1. Open `index.html` with any browser (right-click → Open With)
2. You'll see the profile selection screen

**On iPhone/iPad:**
1. Open Safari
2. Go to file location or use a local server
3. Bookmark the page
4. Add to Home Screen for app-like experience

### Step 3: Create Your First Profile

1. You'll see **"Juice Training"** header
2. Enter your name: `"Your Name"`
3. Tap **Create**
4. Your profile appears below

### Step 4: Start Studying

1. Tap your profile name
2. **Front card** (blue/purple) shows:
   - The question with blanks to fill
   - An input field for your answer
   - Text "Tap to flip"

3. **Type your answer** in the input field
4. **Tap anywhere on the card** to flip
5. **Back card** (pink/coral) shows:
   - The complete answer
   - Your answer vs. expected answer
   - Feedback (Perfect/Close/Incorrect/etc.)
   - **4 rating buttons**: Again, Hard, Good, Easy

6. **Tap a rating button** to:
   - Score the card
   - Earn XP
   - Move to next card

### Step 5: Track Progress

**Footer shows (while studying):**
- Your profile name
- Current level (calculated from XP)
- Total XP earned
- Back button to return to profile selection

## What Happens When You Rate

### Rating Bonuses
| Rating | Effect | XP Multiplier |
|--------|--------|---------------|
| Again | Card studied soon | 1.0x |
| Hard | Card studied later | 1.0x |
| Good | Standard reward | 1.25x |
| Easy | High reward | 1.5x |

### XP Awards Based on Accuracy
| Result | Base XP |
|--------|---------|
| Perfect Match | 100 |
| Close (Typos) | 75 |
| Acceptable (Spelling) | 50 |
| Incorrect | 0 |
| Forbidden Flavor | -10 |

### Example
- Answer "strawberry" perfectly → 100 XP
- Rate "Good" → 100 × 1.25 = **125 XP**
- Answer "strawbery" (typo) → 75 XP
- Rate "Easy" → 75 × 1.5 = **112 XP**

## Creating Your Own Card Data

### Format
Create a CSV file with tabs separating:
```
Text	Name	Category	Difficulty	Notes
mixing {{c1::strawberry}}, tangy {{c2::kiwi}}	Juice Name	Fruit	Beginner	Training note
```

### Card Format
- Use `{{c1::answer}}` for first blank (required)
- Use `{{c2::answer}}` for second blank (optional)
- Use `{{c3::answer}}` for third blank (optional)

### Example Cards
```
Rich {{c1::vanilla}} with creamy {{c2::caramel}} notes	Vanilla Dream	Dessert	Beginner	Smooth creamy blend
Tart {{c1::lemon}} meets sweet {{c2::raspberry}}	Lemon Razz	Citrus	Intermediate	Bright summer flavor
```

### Import Steps
1. Replace `juice_cloze_import_UPDATED.csv` with your file
2. Clear browser localStorage:
   - Open console (F12)
   - Type: `localStorage.clear()`
   - Refresh page
3. App auto-loads new cards

## Features at a Glance

| Feature | Status |
|---------|--------|
| Custom card flip animation | ✅ Working |
| Custom rating buttons | ✅ Working |
| XP/leveling system | ✅ Working |
| Profile system | ✅ Working |
| Answer validation | ✅ Working |
| Fuzzy matching | ✅ Working |
| Flavor distinction | ✅ Working |
| Mobile responsive | ✅ Working |
| Offline capability | ✅ Working |
| Data persistence | ✅ Working |

## Troubleshooting

### "No cards available" error
- CSV file not in same directory as `index.html`
- CSV has wrong format (use tabs, not spaces)
- Browser localStorage quota exceeded

**Fix:**
1. Check file location
2. Clear localStorage: `localStorage.clear()` in console
3. Refresh page

### Cards not loading after closing app
- Browser may have cleared storage
- Try opening in incognito/private mode
- Check if cookies are enabled

**Fix:**
1. Ensure cookies/storage enabled in browser settings
2. Open index.html locally (not from cloud)
3. Keep app open for first time to cache cards

### Animation is choppy
- This is normal on slower devices
- No fix needed, functionality still works
- Can disable animations in browser settings

### Profile data disappeared
- Storage was cleared (happens if you clear browser data)
- Try opening in different browser to check
- Profile data is stored locally, not in cloud

## Tips for Best Experience

### On iPhone
1. Use Safari (best performance)
2. Bookmark the file
3. Tap Share → Add to Home Screen
4. Creates app-like icon on home screen
5. Full-screen, no browser chrome

### Study Sessions
1. Create a profile per user
2. Each person has their own stats
3. No shared/combined tracking
4. Profile shows: Level, XP, Total Cards

### Card Organization
1. Use "Name" field for product name
2. Use "Category" for flavor profile
3. Use "Difficulty" for challenge level
4. Use "Notes" for study hints

## Common Questions

**Q: Can I export my profile data?**
A: Yes! In browser console:
```javascript
copy(localStorage.getItem('juice_profiles'))
```
Paste into text file to backup.

**Q: Can I study without internet?**
A: Yes! App works fully offline. Cards must load once first.

**Q: Can I sync to multiple devices?**
A: Not yet. Future version will support cloud sync.

**Q: Can I add/remove cards?**
A: Yes! Replace CSV and clear storage (see "Creating Your Own Card Data" above).

**Q: Can I customize colors?**
A: Yes! Edit `index.html` in text editor, find the `<style>` section, change gradient colors.

## Next Steps

1. ✅ Open `index.html` in browser
2. ✅ Create a profile
3. ✅ Study a few cards
4. ✅ Check your XP and level in footer
5. ✅ Come back and do more!

## Need Help?

1. **Check console for errors** (F12 → Console tab)
2. **Clear storage and refresh**: `localStorage.clear()`
3. **Make sure CSV is in same folder** as `index.html`
4. **Try different browser** to isolate issues
5. **Check file paths** in `load-cards.js`

---

**Ready to start? Open `index.html` now!**

Questions or issues? All code is readable and commented for easy customization.
