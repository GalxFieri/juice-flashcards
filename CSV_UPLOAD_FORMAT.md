# CSV Upload Format Guide

## Overview

The CSV upload system expects a specific format for flashcard data. Your existing test CSV files use a different format, so you need to convert them using the provided conversion script.

## Required vs Optional Columns

### Required Columns (Must have these 3):
- **id** - Unique identifier for each card (alphanumeric + hyphens only)
- **question** - The front of the card (what students see first)
- **answer** - The back of the card (the response/product name)

### Optional Columns (Nice to have):
- **category** - Product category (eJuice, Disposable Vapes, etc.)
- **difficulty** - Skill level (Beginner, Intermediate, Advanced)
- **tags** - Comma-separated keywords for filtering

## Example Format

```
id	question	answer	category	difficulty
sad-boy-custard-cookie-001	Sad Boy - Custard Cookie: Rich cookie dough with {{c1::custard}} undertones	Sad Boy - Custard Cookie	Dessert	Beginner
big-bottle-co-lemonade-002	Big Bottle Co - Electric Lemonade: Tangy {{c1::blue raspberry}} with {{c2::lemonade}}	Big Bottle Co - Electric Lemonade	Citrus	Intermediate
```

## How Your Format Differs

### Your Current Format:
```
Text | Name | Category | Difficulty | Notes
Text: Rich cookie dough... | Name: Sad Boy | Category: Dessert | Difficulty: Beginner | Notes: ...
```

### New Upload Format:
```
id | question | answer | category | difficulty
sad-boy-001 | Rich cookie dough... | Sad Boy | Dessert | Beginner
```

### Column Mapping:
- **Text** → **question**
- **Name** → **answer**
- **Category** → **category**
- **Difficulty** → **difficulty**
- **Notes** → (removed, not used)

## Converting Your Files

### Automatic Conversion (Recommended)

Use the provided conversion script to automatically transform your CSV files:

```bash
# Convert your juice test file
node convert-csv-format.js juice_cloze_import_UPDATED.csv

# Convert your raz disposable vape file
node convert-csv-format.js raz_disposable_vape_cloze.csv

# Output files will be created:
# - juice_cloze_import_UPDATED_converted.csv (105 cards)
# - raz_disposable_vape_cloze_converted.csv (75 cards)
```

### Manual Conversion (If needed)

If you create new CSV files manually, follow this structure:

1. **Header row:**
   ```
   id	question	answer	category	difficulty
   ```
   (Use tabs to separate columns)

2. **Data rows:**
   ```
   raz-ruby-001	Raz - Ruby: {{c1::cherry}}, {{c2::strawberry}}, {{c3::raspberry}}	Raz - Ruby	Raz	Intermediate
   raz-tiffany-002	Raz - Tiffany: {{c1::kiwi}}, {{c2::watermelon}}	Raz - Tiffany	Raz	Beginner
   ```

## ID Generation Rules

The ID field should follow these rules:
- ✅ **Lowercase** (no uppercase letters)
- ✅ **Alphanumeric + hyphens** (a-z, 0-9, -)
- ✅ **Unique** (no duplicate IDs in same upload)
- ✅ **Readable** (derived from product name)

### ID Examples:
- `sad-boy-custard-cookie-001`
- `big-bottle-co-electric-lemonade-002`
- `raz-ruby-001`
- `twist-berry-amber-006`

## Cloze Format (Preserved)

Your cloze question format is fully supported and preserved during conversion:

```
Question: Sad Boy - Pink: Sweet {{c1::strawberry}} with fluffy {{c2::cotton candy}}
Answer: Sad Boy - Pink
```

The cloze markers (`{{c1::answer}}`) are automatically recognized and work with the spaced repetition system.

## Uploading to Admin Dashboard

Once your CSV is in the correct format:

1. Go to **Settings** → **Admin Dashboard**
2. Scroll to **Manage Product Cards**
3. Click **Upload Cards** or drag-drop your CSV
4. System validates the file format
5. Select a category
6. Click **Upload to Firestore**
7. Cards are now available in study mode

## Validation Rules

The upload system checks:
- ✅ CSV has header row with required columns
- ✅ All data rows have `id`, `question`, `answer`
- ✅ All IDs are unique (no duplicates)
- ✅ ID format is valid (lowercase, hyphens only)
- ✅ No empty cells in required columns

## Files Ready to Upload

The following converted files are ready to use:

1. **juice_cloze_import_UPDATED_converted.csv**
   - 105 juice cards
   - Categories: Dessert, Citrus, Carnival, Tropical, Berry, Fruit, Cream, Spice, etc.
   - Difficulty levels: Beginner, Intermediate, Advanced

2. **raz_disposable_vape_cloze_converted.csv**
   - 75 raz disposable vape cards
   - Category: Raz
   - Difficulty levels: Beginner, Intermediate, Advanced

## Need Help?

- Check the **Test Upload UI** in Admin Dashboard
- Look at sample converted files for reference
- Use the conversion script for batch conversions
- Check browser console for validation error messages

---

**Last Updated:** November 20, 2025
**Version:** 1.0
