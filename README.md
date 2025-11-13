# Juice Flashcards - Custom Web App

A beautiful, fully customizable flashcard web application built specifically for iOS and mobile browsers. Complete control over card flips, buttons, styling, and user experience.

## Features

✅ **Fully Custom Interface**
- No Anki buttons - complete control over every interaction
- Elegant 3D card flip animation
- Beautiful gradient backgrounds (blue/purple front, pink/coral back)
- Smooth mobile-first responsive design

✅ **Profile System**
- Create and manage multiple user profiles
- Each profile has individual stats tracking
- No shared/combined statistics

✅ **XP & Leveling System**
- Earn XP for correct answers
- Wrong answers award reduced XP
- Level up as you earn XP (100 XP = 1 level)
- Streak bonuses for consecutive correct answers

✅ **Answer Validation**
- Fuzzy matching for typos (Levenshtein distance algorithm)
- Flavor distinction enforcement (Blueberry ≠ Blue Raspberry)
- Four feedback levels: Perfect, Close, Acceptable, Incorrect
- Forbidden flavor combinations detection

✅ **Mobile Optimized**
- Works on iOS Safari, Chrome, Firefox
- Touch-friendly buttons (min 44px target size)
- Responsive design for all screen sizes
- No horizontal scrolling

✅ **Offline Capable**
- Data persists using localStorage
- Works without internet connection
- Card data cached locally

## Files Included

| File | Purpose |
|------|---------|
| `index.html` | Main app file - open this in browser |
| `load-cards.js` | CSV parser - converts cards to JSON |
| `answer-validation.js` | Fuzzy matching & flavor validation logic |
| `profile-system.js` | Profile management (included but not used by app yet) |
| `juice_cloze_import_UPDATED.csv` | Card data - 100+ juice flavor descriptions |

## How to Use

### 1. **Open the App**
Simply open `index.html` in your web browser:
- iOS Safari: Bookmark the file, save to home screen for app-like experience
- Chrome/Firefox: Open directly or save as progressive web app

### 2. **Create a Profile**
1. Enter your name in the input field
2. Tap "Create"
3. Your profile appears in the list

### 3. **Start Studying**
1. Tap your profile name
2. Questions appear on front card (blue/purple)
3. Type your answer
4. Tap the card to flip and see the answer
5. Rate your performance (Again/Hard/Good/Easy)

### 4. **Track Progress**
- Current level shown in footer
- XP awarded based on accuracy
- Stats per profile (no combined tracking)

## Card Format

Cards use Anki's cloze deletion format:
```
mixing {{c1::strawberry}}, tangy {{c2::kiwi}}, fizzy {{c3::candy}}
```

This creates 3 individual cards:
1. Card 1: "mixing _____, tangy **kiwi**, fizzy **candy**"
2. Card 2: "mixing **strawberry**, tangy _____, fizzy **candy**"
3. Card 3: "mixing **strawberry**, tangy **kiwi**, fizzy _____"

## XP & Leveling

### Earning XP
- **Perfect match**: 100 XP
- **Close (typos)**: 75 XP
- **Acceptable (spelling)**: 50 XP
- **Incorrect**: 0 XP
- **Forbidden flavor**: -10 XP

### Rating Bonuses
- **Good**: 1.25x XP multiplier
- **Easy**: 1.5x XP multiplier

### Leveling
- 100 XP = 1 level
- Level = Current XP / 100 + 1

## Flavor Distinction

The app enforces critical flavor differences:
- ❌ Cannot accept "Blue Raspberry" when "Blueberry" is expected
- ❌ Cannot accept "Blueberry" when "Blue Raspberry" is expected

This prevents store training confusion where these are distinct products.

## Customization

### Colors
Edit in `index.html` `<style>` section:
- **Front card gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Back card gradient**: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`

### Card Data
Replace `juice_cloze_import_UPDATED.csv` with your own CSV file in the same format:
```
Text	Name	Category	Difficulty	Notes
description {{c1::answer}}...	Name	Category	Level	Hint
```

### Styling
All CSS is in `index.html`. Search for `/* ====` comments to find sections.

## Browser Compatibility

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Safari | ✅ | ✅ iOS 12+ |
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Edge | ✅ | ✅ |

## Technical Details

### Storage
- Uses `localStorage` for profiles and data
- Max ~5-10MB per origin (plenty for flashcards)
- Persists across sessions

### Performance
- Single HTML file (~33KB)
- No external dependencies
- Pure vanilla JavaScript
- Smooth 60fps animations

### Offline
- Works completely offline
- Cards loaded on first visit
- Data synced to localStorage

## Troubleshooting

### Cards Not Loading
1. Make sure `juice_cloze_import_UPDATED.csv` is in same directory
2. Open browser console (F12) to check errors
3. Check that CSV has proper tab-separated format

### Profile Data Lost
- Check browser storage settings
- Ensure cookies/storage not cleared
- Try different browser

### Animation Stuttering
- This is normal on older devices
- Can be disabled in Settings (prefers-reduced-motion)
- Try closing other apps

## Future Enhancements

- [ ] Cloud sync (Firebase)
- [ ] Export/import profiles
- [ ] Spaced repetition algorithm
- [ ] Voice input
- [ ] Haptic feedback
- [ ] Achievement badges
- [ ] Leaderboards
- [ ] Study session types

## Development

### Adding New Features
All code is in `index.html` in the `JuiceFlashcardApp` class.

Key methods:
- `displayCard()` - Shows current card
- `validateAnswer()` - Checks answer
- `submitRating()` - Processes card rating
- `nextCard()` - Moves to next card

### Adding New Card Data
1. Format CSV as: `Text[TAB]Name[TAB]Category[TAB]Difficulty[TAB]Notes`
2. Place in `juice_cloze_import_UPDATED.csv`
3. Clear localStorage and refresh browser
4. Or manually set: `localStorage.setItem('juice_cards', JSON.stringify(cards))`

## License

MIT - Free to use and modify

## Support

Questions? Issues? Features requests?

All logic is self-contained and commented. The app is designed to be simple, performant, and easy to customize.

---

**Last Updated**: November 13, 2024
**Version**: 1.0.0
