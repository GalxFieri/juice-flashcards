#!/usr/bin/env node

/**
 * Convert existing juice CSV format to new upload-compatible format
 * Usage: node convert-csv-format.js <input.csv> <output.csv>
 */

const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === '\t' && !insideQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    if (current.length > 0) {
        result.push(current.trim());
    }

    return result;
}

function escapeCSVValue(value) {
    if (!value) return '';
    if (typeof value !== 'string') value = String(value);

    // If contains special characters, wrap in quotes and escape internal quotes
    if (value.includes('\t') || value.includes('"') || value.includes('\n')) {
        return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
}

function generateId(productName, index) {
    // Convert "Big Bottle Co - Electric Lemonade" to "big-bottle-co-electric-lemonade-001"
    const base = productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const paddedIndex = String(index + 1).padStart(3, '0');
    return `${base}-${paddedIndex}`;
}

function convertCSV(inputFile) {
    console.log(`\n📂 Converting CSV file: ${inputFile}\n`);

    try {
        // Read input file
        const content = fs.readFileSync(inputFile, 'utf-8');
        const lines = content.trim().split('\n');

        if (lines.length < 2) {
            console.error('❌ Error: CSV file must have header and data rows');
            process.exit(1);
        }

        // Parse header
        const headers = parseCSVLine(lines[0]);
        console.log('📋 Original columns:', headers);

        // Find column indices
        const textIndex = headers.findIndex(h => h.toLowerCase() === 'text');
        const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');
        const categoryIndex = headers.findIndex(h => h.toLowerCase() === 'category');
        const difficultyIndex = headers.findIndex(h => h.toLowerCase() === 'difficulty');

        if (textIndex === -1 || nameIndex === -1) {
            console.error('❌ Error: CSV must have "Text" and "Name" columns');
            process.exit(1);
        }

        console.log('✅ Found required columns:');
        console.log(`   - Text (column ${textIndex + 1})`);
        console.log(`   - Name (column ${nameIndex + 1})`);
        if (categoryIndex !== -1) console.log(`   - Category (column ${categoryIndex + 1})`);
        if (difficultyIndex !== -1) console.log(`   - Difficulty (column ${difficultyIndex + 1})`);

        // Build output header
        const outputHeader = 'id\tquestion\tanswer\tcategory\tdifficulty';

        // Convert data rows
        const outputLines = [outputHeader];
        let convertedCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = parseCSVLine(line);

            // Extract values
            const question = values[textIndex] || '';
            const answer = values[nameIndex] || '';
            const category = categoryIndex !== -1 ? (values[categoryIndex] || '') : '';
            const difficulty = difficultyIndex !== -1 ? (values[difficultyIndex] || '') : '';

            // Skip if missing question or answer
            if (!question || !answer) {
                console.warn(`⚠️  Skipping row ${i + 1}: missing question or answer`);
                continue;
            }

            // Generate unique ID from answer (product name)
            const id = generateId(answer, convertedCount);

            // Build output row
            const outputRow = [
                escapeCSVValue(id),
                escapeCSVValue(question),
                escapeCSVValue(answer),
                escapeCSVValue(category),
                escapeCSVValue(difficulty)
            ].join('\t');

            outputLines.push(outputRow);
            convertedCount++;
        }

        // Determine output filename
        const inputName = path.basename(inputFile, path.extname(inputFile));
        const outputFile = path.join(
            path.dirname(inputFile),
            `${inputName}_converted.csv`
        );

        // Write output file
        fs.writeFileSync(outputFile, outputLines.join('\n'), 'utf-8');

        console.log(`\n✅ Conversion successful!`);
        console.log(`📊 Converted ${convertedCount} cards`);
        console.log(`💾 Output file: ${outputFile}\n`);

        // Show sample
        console.log('📋 Sample of converted data (first 3 rows):');
        for (let i = 0; i < Math.min(3, outputLines.length); i++) {
            console.log(`   ${outputLines[i].substring(0, 100)}...`);
        }
        console.log('');

        return outputFile;

    } catch (error) {
        console.error('❌ Error reading file:', error.message);
        process.exit(1);
    }
}

// Run conversion
if (require.main === module) {
    const inputFile = process.argv[2];

    if (!inputFile) {
        console.log('\n📖 Usage: node convert-csv-format.js <input.csv>');
        console.log('\nExamples:');
        console.log('  node convert-csv-format.js juice_cloze_import_UPDATED.csv');
        console.log('  node convert-csv-format.js raz_disposable_vape_cloze.csv\n');
        process.exit(0);
    }

    if (!fs.existsSync(inputFile)) {
        console.error(`❌ Error: File not found: ${inputFile}`);
        process.exit(1);
    }

    convertCSV(inputFile);
}

module.exports = { convertCSV };
