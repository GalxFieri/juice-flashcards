#!/usr/bin/env node

/**
 * Migration script to convert existing eJuice CSV to new cardSets Firestore structure
 * Usage: node migrate-cards.js
 */

const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, 'raz_disposable_vape_cloze.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const lines = csvContent.trim().split('\n');
const headers = lines[0].split('\t');

console.log('Processing eJuice CSV migration...');
console.log(`Found ${lines.length - 1} data rows`);

// Parse CSV data
const cards = [];
for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split('\t');

  // Create card object matching our format
  const card = {
    id: `raz_${i}`,  // Create numeric ID
    question: values[0],  // Text column
    answer: values[1],    // Name column
    category: values[2],  // Category column
    tags: (values[4] || '').split(',').map(t => t.trim()).filter(t => t).join(','),
    difficulty: values[3] || 'Medium'  // Difficulty column
  };

  cards.push(card);
}

// Create the card set object
const cardSet = {
  name: 'eJuice',
  category: 'eJuice',
  description: 'Flashcards for eJuice/Disposable Vape products',
  cards: cards,
  uploadedBy: 'system-migration',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  cardCount: cards.length
};

// Output the JSON that can be directly imported to Firestore
const output = {
  setId: 'ejuice',
  setData: cardSet
};

// Write migration output
const outputPath = path.join(__dirname, 'ejuice-migration.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✅ Migration complete!`);
console.log(`Converted ${cards.length} cards from eJuice CSV`);
console.log(`Output saved to: ${outputPath}`);
console.log(`\nCard set structure:`);
console.log(`- Set ID: ${output.setId}`);
console.log(`- Name: ${cardSet.name}`);
console.log(`- Card Count: ${cardSet.cardCount}`);
console.log(`- Sample card:`, cards[0]);

// Also output a sample card format for verification
console.log(`\n📋 Sample cards (first 3):`);
cards.slice(0, 3).forEach((card, idx) => {
  console.log(`\n${idx + 1}. ID: ${card.id}`);
  console.log(`   Q: ${card.question.substring(0, 60)}...`);
  console.log(`   A: ${card.answer}`);
  console.log(`   Category: ${card.category}`);
});
