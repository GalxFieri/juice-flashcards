# How to Load Cards - Juice Flashcards Web App

## Quick Answer

1. Open `index.html` in your browser
2. Click the **"Load Sample Cards"** button
3. A popup will confirm: "✅ Loaded 108 cards!"
4. Create a profile and select it
5. Start studying!

---

## Step-by-Step

### Step 1: Open the App
- Open `index.html` in any web browser (Chrome, Safari, Firefox)
- You'll see the profile selection screen

### Step 2: Load Cards
- Look for the golden **"Load Sample Cards"** button at the bottom
- Click it
- A popup will appear showing how many cards were loaded

### Step 3: Create Profile
- Enter your name in the input field
- Click **"Create"**
- Your profile appears in the list

### Step 4: Start Studying
- Click your profile name
- Study card appears
- Type your answer, tap to flip!

---

## What's Happening Behind the Scenes

When you click "Load Sample Cards":

1. **Fetches CSV file** → `juice_cloze_import_UPDATED.csv`
2. **Parses the data** → Converts tab-separated values to card objects
3. **Validates format** → Ensures each card has cloze format (`{{c1::answer}}`)
4. **Stores in browser** → Saves to `localStorage` for persistence
5. **Confirmation** → Shows how many cards loaded

---

## Using Your Own Cards

### Option 1: Replace the CSV File
1. Create your own CSV file with this format:
   ```
   Text	Name	Category	Difficulty	Notes
   Question {{c1::answer}}	Name	Type	Level	Hint
   ```

2. Save as `juice_cloze_import_UPDATED.csv`

3. Place in same folder as `index.html`

4. Click "Load Sample Cards" button

5. Your cards will load!

### Option 2: Create CSV Step-by-Step

**File Format:**
- Separator: **Tab** (not space, not comma)
- First row: Headers (don't change these)
- Following rows: Your card data

**Headers:**
```
Text	Name	Category	Difficulty	Notes
```

**Example Cards:**
```
Text	Name	Category	Difficulty	Notes
mixing {{c1::strawberry}}, tangy {{c2::kiwi}}	Fruit Mix	Fruit	Beginner	Two fruit flavors
rich {{c1::vanilla}} with {{c2::chocolate}}	Vanilla Choco	Dessert	Beginner	Classic combination
```

**Save as:** `juice_cloze_import_UPDATED.csv`

**File Encoding:** UTF-8 (most text editors default to this)

---

## Cloze Format Explained

### What is Cloze Deletion?
Cloze deletion is hiding specific words that the learner must fill in.

### Format:
```
{{c1::answer}}  - First blank
{{c2::answer}}  - Second blank
{{c3::answer}}  - Third blank
```

### Example:
```
The capital of France is {{c1::Paris}} and it's known for the {{c2::Eiffel Tower}}
```

Creates 2 cards:
1. "The capital of France is _____ and it's known for the Eiffel Tower"
2. "The capital of France is Paris and it's known for the _____"

### Your Juice Example:
```
mixing {{c1::strawberry}}, tangy {{c2::kiwi}}, fizzy {{c3::candy}}
```

Creates 3 cards:
1. "mixing _____, tangy **kiwi**, fizzy **candy**"
2. "mixing **strawberry**, tangy _____, fizzy **candy**"
3. "mixing **strawberry**, tangy **kiwi**, fizzy _____"

---

## Troubleshooting

### Issue: "Could not load CSV file" Error

**Cause:** The CSV file isn't in the same folder as `index.html`

**Fix:**
1. Make sure `juice_cloze_import_UPDATED.csv` is in `D:\Custom_Web_app\`
2. Check the filename is exactly `juice_cloze_import_UPDATED.csv`
3. Refresh your browser
4. Try clicking "Load Sample Cards" again

### Issue: "CSV file is empty or invalid format" Error

**Cause:** CSV doesn't have cloze format or is malformed

**Fix:**
1. Open the CSV file in a text editor
2. Check that each row has tabs (not spaces) separating columns
3. Check that the "Text" column has `{{c1::answer}}` format
4. Save as UTF-8 encoding
5. Try loading again

### Issue: No Cards Loaded But No Error

**Cause:** The CSV file exists but has no valid cloze cards

**Fix:**
1. Check your CSV in text editor
2. Make sure at least one row has `{{c}}` format
3. Make sure first row is headers (Text, Name, Category, Difficulty, Notes)
4. Check that data rows come after headers

### Issue: Load Button Doesn't Appear

**Cause:** JavaScript isn't loading properly

**Fix:**
1. Open browser console (F12)
2. Check for error messages
3. Refresh page
4. Try different browser
5. Clear browser cache

### Issue: Cards Load But Then Disappear

**Cause:** Browser storage was cleared

**Fix:**
1. Make sure cookies/storage is enabled
2. Click "Load Sample Cards" again
3. Cards are now cached - they won't disappear

---

## Creating Cards in a Spreadsheet

### Using Excel/Google Sheets:

1. **Create columns:**
   - A: Text (with cloze format)
   - B: Name
   - C: Category
   - D: Difficulty
   - E: Notes

2. **Add your data**

3. **Export as CSV:**
   - Excel: File → Save As → CSV (UTF-8)
   - Google Sheets: File → Download → CSV

4. **Name it:** `juice_cloze_import_UPDATED.csv`

5. **Place in app folder** with `index.html`

6. **Click "Load Sample Cards"**

---

## FAQ

**Q: Can I load multiple CSV files?**
A: Not yet. You can only have one set of cards loaded at a time. Replace the CSV and click "Load" again.

**Q: Can I add cards without reloading?**
A: Not currently. To add more cards:
1. Edit the CSV file
2. Click "Load Sample Cards" again
3. New cards replace old ones

**Q: Are the cards saved forever?**
A: Yes! Once loaded, they're stored in your browser's `localStorage`. They persist even after closing the app.

**Q: Can I backup my cards?**
A: Yes! The CSV file is your backup. Keep a copy safe.

**Q: Can I use a different filename?**
A: Not without editing the app. The app specifically looks for `juice_cloze_import_UPDATED.csv`. You can change this in `index.html` line 838 if needed.

**Q: What's the maximum number of cards?**
A: Technically unlimited, but practical limit is ~5,000 cards (limited by browser storage).

**Q: Can I import from other apps?**
A: You'd need to export from the other app as CSV with cloze format, then load here.

---

## For Developers

### Manual Card Loading (Advanced)

If you want to load cards programmatically:

```javascript
// In browser console (F12):
const cards = [
    {
        id: "1",
        text: "mixing {{c1::strawberry}}",
        name: "Juice",
        category: "Fruit",
        difficulty: "Beginner",
        notes: "Red fruit"
    }
];
localStorage.setItem('juice_cards', JSON.stringify(cards));
location.reload();
```

### Exporting Loaded Cards

```javascript
// In browser console:
const cards = JSON.parse(localStorage.getItem('juice_cards'));
copy(JSON.stringify(cards, null, 2));
// Paste into text file and save
```

---

## Summary

**To add cards:**
1. Make sure CSV is named `juice_cloze_import_UPDATED.csv`
2. Make sure CSV is in same folder as `index.html`
3. Click **"Load Sample Cards"** button
4. Popup confirms how many loaded
5. Done! Cards are ready to study

**That's it!** No complex setup, no external tools needed.
