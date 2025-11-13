/**
 * CSV to JSON Card Loader
 * Converts juice_cloze_import_UPDATED.csv into JSON format for the app
 */

async function loadCardsFromCSV() {
    try {
        const response = await fetch('juice_cloze_import_UPDATED.csv');
        const csvText = await response.text();
        const cards = parseCSV(csvText);
        localStorage.setItem('juice_cards', JSON.stringify(cards));
        console.log('Loaded', cards.length, 'cards');
        return cards;
    } catch (error) {
        console.error('Error loading cards:', error);
        return [];
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split('\t');
    const cards = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        if (values.length < 2) continue;

        const card = {
            id: i.toString(),
            text: values[0] || '',
            name: values[1] || '',
            category: values[2] || '',
            difficulty: values[3] || '',
            notes: values[4] || ''
        };

        if (card.text.includes('{{c')) {
            cards.push(card);
        }
    }

    return cards;
}

// Auto-load on page load
document.addEventListener('DOMContentLoaded', async () => {
    const storedCards = localStorage.getItem('juice_cards');
    if (!storedCards) {
        await loadCardsFromCSV();
    }
});
