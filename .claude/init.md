# Juice Flashcards - Standalone Web App

## Project Overview
A custom vanilla HTML/CSS/JavaScript flashcard web application built for studying juice flavors via local localhost server. This is a **standalone web app alternative** to Anki WEB, designed to run on `localhost:8000` with full mobile (iOS/iPad) support.

## Core Features Implemented

### ✅ Flashcard System
- **Cloze deletion format**: `{{c1::answer}}`, `{{c2::answer}}`, etc.
- **Front card** (Blue gradient): Shows cloze text with blanks to fill
- **Back card** (Pink gradient): Shows complete answer with user comparison
- Cards loaded from CSV file (105+ juice flavor cards included)

### ✅ Answer Validation
- Fuzzy matching using Levenshtein distance algorithm
- Flavor distinction enforcement (Blueberry ≠ Blue Raspberry)
- Common spelling variations accepted
- Multiple feedback levels:
  - `feedback-correct`: Perfect match (green)
  - `feedback-close`: Minor differences (yellow)
  - `feedback-acceptable`: Acceptable match (orange)
  - `feedback-incorrect`: Wrong answer (red)
  - `feedback-forbidden`: Flavor confusion (bright red)

### ✅ Profile System
- Per-user profile creation and selection
- Individual stats tracking (never combined):
  - Current level
  - Total XP
  - Cards studied
  - Accuracy rate
- Profile data persisted in localStorage

### ✅ XP & Leveling System
- XP awarded based on answer quality:
  - Perfect: 100 XP
  - Close: 75 XP
  - Acceptable: 50 XP
  - Incorrect: 0 XP
  - Forbidden flavor: -10 XP (penalty)
- Rating multipliers (Easy/Good/Hard/Again)
- Level calculation: `Level = Math.floor(XP / 100) + 1`

### ✅ User Interface
- **Check Answer Button**: Explicit button + Enter key support
- **3D Card Flip Animation**: CSS keyframes (0.8s to back, 0.6s to front)
- **Keyboard Shortcuts**:
  - `Enter` in input = Check answer
  - `1` = Again, `2` = Hard, `3` = Good, `4` = Easy (on back card)
- **Mobile-Responsive Design**:
  - Touch-friendly 44px+ target sizes
  - iOS Safari compatible
  - Flexible text wrapping for all screen sizes

### ✅ Data Management
- **CSV Import**: Tab-separated format with 5 fields
  - Text (with cloze markers)
  - Name
  - Category
  - Difficulty
  - Notes
- **localStorage Persistence**: Profiles, cards, XP all saved locally
- **No backend required**: Pure client-side operation

## File Structure

```
D:\Custom_Web_app\
├── index.html                      # Main application (43 KB, all-in-one)
├── answer-validation.js            # Fuzzy matching & flavor validation
├── profile-system.js               # Profile utilities (optional)
├── load-cards.js                   # CSV parsing utilities
├── juice_cloze_import_UPDATED.csv  # Card data (105+ cards)
├── run-server.bat                  # Windows batch to start server
├── run-server.ps1                  # PowerShell alternative
└── .claude/init.md                 # This file
```

## How to Run

### Windows (Recommended)
```bash
# Double-click this file or run from command prompt:
run-server.bat

# Then open browser to:
http://localhost:8000
```

### Mac/Linux
```bash
cd D:\Custom_Web_app
python -m http.server 8000

# Then open:
http://localhost:8000
```

### PowerShell (Windows)
```powershell
.\run-server.ps1
```

## CSS Architecture

### Animation System
- **@keyframes flipToBack**: 0° → 180° (0.8s, ease-in-out)
- **@keyframes flipToFront**: 180° → 0° (0.6s, ease-in-out)
- Uses CSS `transform: rotateY()` with `transform-style: preserve-3d`
- 3D perspective: 1000px on container

### Color Scheme
- **Front card**: Blue/purple gradient (`#667eea` → `#764ba2`)
- **Back card**: Pink/coral gradient (`#f093fb` → `#f5576c`)
- **Cloze blank**: Gold dashed border with semi-transparent background
- **Hints**: Gold background with white text
- **Answers**: Green background

### Responsive Breakpoints
- Mobile (max 800px): Reduced padding, adjusted font sizes
- Desktop: Full 80vh card height with 600px max
- Flex-based layout adapts to all screen sizes

## JavaScript Architecture

### Main Class: `JuiceFlashcardApp`
**Core Methods:**
- `init()`: Bootstrap and attach all listeners
- `loadData()`: Restore profiles and cards from localStorage
- `saveData()`: Persist all changes to localStorage
- `displayCard()`: Render front/back with animation reset
- `toggleFlip()`: Trigger card flip animation with validation
- `validateAnswer()`: Compare user answer with expected
- `submitRating()`: Process card difficulty rating and XP
- `nextCard()`: Advance to next card

**Event Listeners:**
- Button clicks (Check Answer, ratings, profile create)
- Keyboard: Enter (check), 1-4 (ratings), profile name creation
- No card-click handlers (prevents accidental flips)

## Data Flow

```
User Types Answer
    ↓
Clicks "Check Answer" or Presses Enter
    ↓
toggleFlip() validates answer
    ↓
Card flips with 0.8s animation
    ↓
Back card shows with feedback + your answer comparison
    ↓
User presses 1/2/3/4 or clicks rating
    ↓
XP calculated and added to profile
    ↓
Card advances and flips back to front (0.6s)
    ↓
Next card displays, ready for input
```

## Key Technical Decisions

### Why No Frameworks?
- Vanilla HTML/CSS/JS works perfectly in browsers
- No build step needed
- Smaller file size
- Better control over animations
- Easier to deploy to Anki WEB (when needed)

### Why localStorage Instead of IndexedDB?
- Simpler API
- Sufficient for 100+ cards
- Automatic persistence
- Works across all browsers

### Why CSS Keyframes Instead of Transitions?
- More reliable animation execution
- Maintains state with `forwards` keyword
- Better browser compatibility
- Visible on all viewport sizes

### Why Fuzzy Matching?
- Handles typos (user types "rasberry" instead of "raspberry")
- But strict on flavors (prevents Blueberry/Blue Raspberry confusion)
- Improves learning experience without sacrificing accuracy

## Current Status

### ✅ Completed
- All core features implemented and tested
- Animation working with keyframes
- Keyboard shortcuts for ratings
- Answer validation with fuzzy matching
- Profile system with individual stats
- CSV card loading
- localStorage persistence

### 🔄 In Progress / Future
- Mobile device testing (iOS Safari, Chrome)
- Haptic feedback for iOS users
- Voice input option
- Spaced repetition algorithm
- Achievement badges and streaks
- Advanced analytics dashboard
- Study session types (Quick Review, Deep Study, etc.)

## Known Limitations

1. **Animation**: Visible on all browsers supporting CSS 3D transforms
2. **Mobile**: Tested on Safari/Chrome, fully responsive but not yet iOS-native
3. **Data**: All stored locally (no cloud sync)
4. **Cards**: Limited to CSV import (no UI for adding new cards yet)

## Debugging Tips

### If cards don't load:
- Open browser DevTools (F12)
- Check Console for CORS errors
- Ensure `juice_cloze_import_UPDATED.csv` exists in same directory
- Try the "Load Sample Cards" button

### If animation doesn't show:
- Check browser supports CSS 3D transforms (modern browsers only)
- Try pressing F12 → Device Emulation → Mobile device
- Animation is 0.8s to back, 0.6s to front

### If answer validation fails:
- Check `answer-validation.js` is loaded (DevTools → Network)
- Falls back to simple exact-match if module fails
- Fuzzy matching requires similarity > 80%

## Quick Start Commands

```bash
# Start server
cd D:\Custom_Web_app && python -m http.server 8000

# Open in browser
http://localhost:8000

# Create profile
Enter name → Click Create

# Load cards
Click "Load Sample Cards" button

# Start studying
Type answer → Click "Check Answer" or press Enter
See result → Press 1/2/3/4 to rate → Next card
```

## File Modifications Log

### Latest Changes (v4)
- Rewrote flip animation using CSS @keyframes for reliability
- Fixed text layout with flex-wrap on cloze-text
- Added numeric keyboard shortcuts (1-4) for ratings
- Improved card overflow handling (auto instead of hidden)
- Added rating-key indicators on buttons

### Previous Changes (v3)
- Added explicit "Check Answer" button
- Removed click-anywhere flip behavior
- Fixed answer validation integration
- Improved navigation flow (front→back→front)

### Previous Changes (v2)
- Increased animation timing for visibility
- Fixed server directory path issue
- Added CSV card loading mechanism

### Initial Release (v1)
- All core features implemented
- Profiles, XP, cards, animations
- Answer validation system

## Git History

All changes are tracked in `.git/` with descriptive commits:
```bash
git log --oneline  # View all commits
```

## Contact / Support

This is a custom-built application. For modifications or features:
- Consult the CLAUDE.md in parent directory for project requirements
- Review git commit history for implementation details
- Check code comments for specific logic explanations

---

**Last Updated**: November 13, 2024
**Status**: Production Ready (with caveats - see Known Limitations)
**Version**: 4.0
