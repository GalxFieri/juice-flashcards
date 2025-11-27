/**
 * CSV Validation Module for Juice/Vape Product Cards
 * Validates CSV format, required fields, and data integrity
 */

const CSVValidator = (function() {
    'use strict';

    // Required columns for different card formats
    const CLOZE_REQUIRED_COLUMNS = ['id', 'question', 'answer'];
    const REVERSE_REQUIRED_COLUMNS = ['id', 'question_characteristic', 'question_customer', 'answer', 'ingredients'];

    // Optional columns (common to both formats)
    const OPTIONAL_COLUMNS = ['category', 'tags', 'difficulty'];

    /**
     * Detect CSV format based on headers
     * @param {array} headers - Array of column headers
     * @returns {string} - 'cloze', 'reverse', or 'unknown'
     */
    function detectFormat(headers) {
        const hasQuestionCharacteristic = headers.includes('question_characteristic');
        const hasQuestionCustomer = headers.includes('question_customer');
        const hasIngredients = headers.includes('ingredients');
        const hasQuestion = headers.includes('question');

        if (hasQuestionCharacteristic && hasQuestionCustomer && hasIngredients) {
            return 'reverse';
        } else if (hasQuestion) {
            return 'cloze';
        } else {
            return 'unknown';
        }
    }

    /**
     * Validate CSV format and structure
     * @param {string} csvText - Raw CSV text content
     * @param {string} format - 'auto', 'cloze', or 'reverse' (default: 'auto')
     * @returns {object} - { valid: boolean, errors: [], warnings: [], data: [], format: string }
     */
    function validateCSV(csvText, format = 'auto') {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            data: [],
            format: format,  // Will be updated if auto-detected
            stats: {
                totalRows: 0,
                validRows: 0,
                invalidRows: 0,
                missingFields: [],
                duplicateIds: []
            }
        };

        try {
            if (!csvText || csvText.trim().length === 0) {
                result.valid = false;
                result.errors.push('CSV file is empty');
                return result;
            }

            // Parse CSV
            const lines = csvText.trim().split('\n');
            if (lines.length < 2) {
                result.valid = false;
                result.errors.push('CSV must contain header row and at least one data row');
                return result;
            }

            // Parse header and detect delimiter
            const headerLine = lines[0];
            const delimiter = detectDelimiter(headerLine);
            const headers = parseCSVLine(headerLine, delimiter);

            if (headers.length === 0) {
                result.valid = false;
                result.errors.push('CSV header is empty or malformed');
                return result;
            }

            // Auto-detect format if needed
            if (format === 'auto') {
                result.format = detectFormat(headers);
                if (result.format === 'unknown') {
                    result.valid = false;
                    result.errors.push('Unable to detect format. CSV must have either: (1) "question" column for cloze format, or (2) "question_characteristic", "question_customer", and "ingredients" for reverse format');
                    return result;
                }
            }

            // Validate headers based on detected format
            const headerValidation = validateHeaders(headers, result.format);
            if (!headerValidation.valid) {
                result.valid = false;
                result.errors.push(...headerValidation.errors);
                return result;
            }

            result.warnings.push(...headerValidation.warnings);

            // Get column indices
            const columnIndices = getColumnIndices(headers, result.format);

            // Parse data rows
            const seenIds = new Set();
            let validRowCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();

                // Skip empty lines
                if (line.length === 0) {
                    continue;
                }

                result.stats.totalRows++;
                const values = parseCSVLine(line, delimiter);

                // Validate row
                const rowValidation = validateRow(values, columnIndices, i + 1, result.format);

                if (!rowValidation.valid) {
                    result.stats.invalidRows++;
                    result.errors.push(...rowValidation.errors);
                    result.valid = false;
                    continue;
                }

                // Check for duplicate IDs
                const cardId = values[columnIndices.id];
                if (seenIds.has(cardId)) {
                    result.stats.duplicateIds.push(cardId);
                    result.errors.push(`Duplicate card ID found: "${cardId}" (rows ${Array.from(seenIds).indexOf(cardId) + 2} and ${i + 1})`);
                    result.valid = false;
                    continue;
                }

                seenIds.add(cardId);

                // Build card data based on format
                const cardData = {
                    id: values[columnIndices.id],
                    category: columnIndices.category !== -1 ? values[columnIndices.category] : null,
                    tags: columnIndices.tags !== -1 ? values[columnIndices.tags] : null,
                    difficulty: columnIndices.difficulty !== -1 ? values[columnIndices.difficulty] : 'Medium',
                    rowNumber: i + 1
                };

                if (result.format === 'reverse') {
                    // Reverse format fields
                    cardData.question_characteristic = values[columnIndices.question_characteristic];
                    cardData.question_customer = values[columnIndices.question_customer];
                    cardData.answer = values[columnIndices.answer];
                    cardData.ingredients = columnIndices.ingredients !== -1 ? values[columnIndices.ingredients] : '';
                } else {
                    // Cloze format fields
                    cardData.question = values[columnIndices.question];
                    cardData.answer = values[columnIndices.answer];
                }

                result.data.push(cardData);

                result.stats.validRows++;
                validRowCount++;
            }

            // Summary
            result.stats.invalidRows = result.stats.totalRows - validRowCount;

            // Warnings for empty data
            if (validRowCount === 0) {
                result.valid = false;
                result.errors.push('No valid data rows found in CSV');
            }

            return result;

        } catch (error) {
            result.valid = false;
            result.errors.push(`CSV parsing error: ${error.message}`);
            return result;
        }
    }

    /**
     * Detect delimiter (comma or tab) from header line
     * @param {string} line - Header line
     * @returns {string} - ',' or '\t'
     */
    function detectDelimiter(line) {
        const commaCount = (line.match(/,/g) || []).length;
        const tabCount = (line.match(/\t/g) || []).length;
        return tabCount > commaCount ? '\t' : ',';
    }

    /**
     * Parse a single CSV line (handle quotes and escaping, support comma and tab delimiters)
     * @param {string} line - CSV line
     * @param {string} delimiter - ',' or '\t'
     * @returns {array} - Parsed values
     */
    function parseCSVLine(line, delimiter = ',') {
        const result = [];
        let current = '';
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    insideQuotes = !insideQuotes;
                }
            } else if (char === delimiter && !insideQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        // Add last field
        result.push(current.trim());

        return result;
    }

    /**
     * Validate CSV headers
     * @param {array} headers - Header columns
     * @param {string} format - 'cloze' or 'reverse'
     * @returns {object} - { valid: boolean, errors: [], warnings: [] }
     */
    function validateHeaders(headers, format) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Select required columns based on format
        const requiredColumns = format === 'reverse' ? REVERSE_REQUIRED_COLUMNS : CLOZE_REQUIRED_COLUMNS;

        // Check required columns
        const headerLower = headers.map(h => h.toLowerCase());

        for (const required of requiredColumns) {
            if (!headerLower.includes(required.toLowerCase())) {
                result.valid = false;
                result.errors.push(`Missing required column for ${format} format: "${required}"`);
            }
        }

        // Check for unknown columns
        const allRequiredColumns = format === 'reverse' ? REVERSE_REQUIRED_COLUMNS : CLOZE_REQUIRED_COLUMNS;
        const knownColumns = [...allRequiredColumns, ...OPTIONAL_COLUMNS].map(c => c.toLowerCase());
        for (const header of headerLower) {
            if (!knownColumns.includes(header)) {
                result.warnings.push(`Unknown column will be ignored: "${header}"`);
            }
        }

        return result;
    }

    /**
     * Get column indices from headers
     * @param {array} headers - Header columns
     * @param {string} format - 'cloze' or 'reverse'
     * @returns {object} - { id: int, question: int, answer: int, ... }
     */
    function getColumnIndices(headers, format) {
        const indices = {};
        const headerLower = headers.map(h => h.toLowerCase());

        const requiredColumns = format === 'reverse' ? REVERSE_REQUIRED_COLUMNS : CLOZE_REQUIRED_COLUMNS;
        const allColumns = [...requiredColumns, ...OPTIONAL_COLUMNS];
        for (const column of allColumns) {
            const index = headerLower.indexOf(column.toLowerCase());
            indices[column] = index;
        }

        return indices;
    }

    /**
     * Validate a single data row
     * @param {array} values - Row values
     * @param {object} columnIndices - Column index map
     * @param {number} rowNumber - Row number (for error messages)
     * @param {string} format - 'cloze' or 'reverse'
     * @returns {object} - { valid: boolean, errors: [] }
     */
    function validateRow(values, columnIndices, rowNumber, format) {
        const result = {
            valid: true,
            errors: []
        };

        // Determine required indices based on format
        let requiredIndices;
        if (format === 'reverse') {
            requiredIndices = [
                columnIndices.id,
                columnIndices.question_characteristic,
                columnIndices.question_customer,
                columnIndices.answer,
                columnIndices.ingredients
            ];
        } else {
            requiredIndices = [columnIndices.id, columnIndices.question, columnIndices.answer];
        }

        const maxIndex = Math.max(...requiredIndices.filter(i => i !== undefined && i !== -1));

        if (values.length <= maxIndex) {
            result.valid = false;
            result.errors.push(`Row ${rowNumber}: Not enough columns. Expected at least ${maxIndex + 1}, got ${values.length}`);
            return result;
        }

        // Validate ID
        if (!values[columnIndices.id] || values[columnIndices.id].trim() === '') {
            result.valid = false;
            result.errors.push(`Row ${rowNumber}: Card ID is empty`);
        }

        // Validate ID format (alphanumeric + underscore, no spaces)
        const idValue = values[columnIndices.id];
        if (idValue && !/^[a-zA-Z0-9_-]+$/.test(idValue)) {
            result.valid = false;
            result.errors.push(`Row ${rowNumber}: Invalid card ID format "${idValue}". Use only letters, numbers, underscores, and hyphens`);
        }

        // Validate format-specific required fields
        if (format === 'reverse') {
            // Reverse format validations
            if (!values[columnIndices.question_characteristic] || values[columnIndices.question_characteristic].trim() === '') {
                result.valid = false;
                result.errors.push(`Row ${rowNumber}: question_characteristic is empty`);
            }

            if (!values[columnIndices.question_customer] || values[columnIndices.question_customer].trim() === '') {
                result.valid = false;
                result.errors.push(`Row ${rowNumber}: question_customer is empty`);
            }

            if (!values[columnIndices.answer] || values[columnIndices.answer].trim() === '') {
                result.valid = false;
                result.errors.push(`Row ${rowNumber}: answer is empty`);
            }

            // ingredients is optional for reverse format
        } else {
            // Cloze format validations
            if (!values[columnIndices.question] || values[columnIndices.question].trim() === '') {
                result.valid = false;
                result.errors.push(`Row ${rowNumber}: question is empty`);
            }

            if (!values[columnIndices.answer] || values[columnIndices.answer].trim() === '') {
                result.valid = false;
                result.errors.push(`Row ${rowNumber}: answer is empty`);
            }
        }

        return result;
    }

    /**
     * Generate a preview of CSV data
     * @param {object} validationResult - Result from validateCSV()
     * @param {number} maxRows - Maximum rows to show (default 10)
     * @returns {string} - HTML table preview
     */
    function generatePreview(validationResult, maxRows = 10) {
        if (validationResult.data.length === 0) {
            return '<p>No valid rows to preview</p>';
        }

        const format = validationResult.format || 'cloze';

        let html = '<table style="border-collapse: collapse; width: 100%; font-size: 12px;">';

        // Generate header based on format
        if (format === 'reverse') {
            html += '<tr style="background-color: #f0f0f0;">';
            html += '<th style="border: 1px solid #ddd; padding: 8px;">ID</th>';
            html += '<th style="border: 1px solid #ddd; padding: 8px;">Question (Characteristic)</th>';
            html += '<th style="border: 1px solid #ddd; padding: 8px;">Question (Customer)</th>';
            html += '<th style="border: 1px solid #ddd; padding: 8px;">Answer</th>';
            html += '<th style="border: 1px solid #ddd; padding: 8px;">Ingredients</th>';
            html += '</tr>';
        } else {
            html += '<tr style="background-color: #f0f0f0;">';
            html += '<th style="border: 1px solid #ddd; padding: 8px;">ID</th>';
            html += '<th style="border: 1px solid #ddd; padding: 8px;">Question</th>';
            html += '<th style="border: 1px solid #ddd; padding: 8px;">Answer</th>';
            html += '</tr>';
        }

        const rowsToShow = validationResult.data.slice(0, maxRows);
        for (const row of rowsToShow) {
            if (format === 'reverse') {
                html += `<tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(row.id)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(row.question_characteristic || '')}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(row.question_customer || '')}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(row.answer)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(row.ingredients || '')}</td>
                </tr>`;
            } else {
                html += `<tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(row.id)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(row.question)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(row.answer)}</td>
                </tr>`;
            }
        }

        // Add "more rows" indicator with appropriate colspan
        const colspan = format === 'reverse' ? 5 : 3;
        if (validationResult.data.length > maxRows) {
            html += `<tr><td colspan="${colspan}" style="border: 1px solid #ddd; padding: 8px; text-align: center; font-style: italic;">
                ... and ${validationResult.data.length - maxRows} more rows
            </td></tr>`;
        }

        html += '</table>';
        return html;
    }

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Validate cloze field syntax in a text string
     * Cloze format: {{c1::answer}}, {{c2::answer}}, etc.
     * @param {string} text - Text containing cloze fields
     * @returns {object} - { valid: boolean, errors: [], warnings: [], fieldCount: number, fields: [] }
     */
    function validateClozeSyntax(text) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            fieldCount: 0,
            fields: []
        };

        if (!text || typeof text !== 'string') {
            result.valid = false;
            result.errors.push('Text must be a non-empty string');
            return result;
        }

        // Match all cloze fields: {{cN::content}}
        const clozeRegex = /\{\{c(\d+)::([^}]+)\}\}/g;
        let match;
        const foundNumbers = new Set();

        while ((match = clozeRegex.exec(text)) !== null) {
            const fieldNum = parseInt(match[1]);
            const fieldContent = match[2];

            result.fields.push({
                number: fieldNum,
                content: fieldContent,
                fullMatch: match[0]
            });

            foundNumbers.add(fieldNum);
            result.fieldCount++;
        }

        // Validate cloze field structure
        if (result.fieldCount === 0) {
            result.valid = false;
            result.errors.push('No cloze fields found. Use format {{c1::answer}}, {{c2::answer}}, etc.');
            return result;
        }

        // Check for minimum 2 cloze fields
        if (result.fieldCount < 2) {
            result.valid = false;
            result.errors.push('Minimum 2 cloze fields required ({{c1::...}}, {{c2::...}})');
        }

        // Check for maximum 5 cloze fields
        if (result.fieldCount > 5) {
            result.valid = false;
            result.errors.push('Maximum 5 cloze fields allowed. Found: ' + result.fieldCount);
        }

        // Check for non-sequential numbering
        const expectedNumbers = Array.from({length: result.fieldCount}, (_, i) => i + 1);
        const actualNumbers = Array.from(foundNumbers).sort((a, b) => a - b);
        if (JSON.stringify(expectedNumbers) !== JSON.stringify(actualNumbers)) {
            result.warnings.push('Cloze fields should be numbered sequentially (c1, c2, c3...)');
        }

        // Check for empty cloze content
        result.fields.forEach(field => {
            if (!field.content.trim()) {
                result.errors.push(`Cloze field {{c${field.number}::}} has empty content`);
                result.valid = false;
            }
        });

        return result;
    }

    /**
     * Extract cloze fields from text and renumber them sequentially
     * @param {string} text - Text with cloze fields
     * @returns {string} - Text with renumbered cloze fields
     */
    function renumberClozeFields(text) {
        const clozeRegex = /\{\{c\d+::([^}]+)\}\}/g;
        let counter = 1;

        return text.replace(clozeRegex, () => {
            return `{{c${counter++}::${RegExp.$1}}}`;
        });
    }

    // ====================================================
    // PRODUCT CATEGORY DATABASE LOADING
    // ====================================================

    /**
     * Parse category CSV file and return as product database array
     * Expected format: Product Name,Edition,Primary Category,Secondary Category,Tertiary Category,Quaternary Category,Notes
     * @param {string} csvText - Raw CSV text of category file
     * @returns {array} - Array of product objects with category data
     */
    function parseProductCategoryCSV(csvText) {
        if (!csvText || csvText.trim().length === 0) {
            console.warn('Product category CSV is empty');
            return [];
        }

        const products = [];
        const lines = csvText.trim().split('\n');

        if (lines.length < 2) {
            console.warn('Product category CSV has no data rows');
            return [];
        }

        // Parse header
        const headerLine = lines[0];
        const delimiter = detectDelimiter(headerLine);
        const headers = parseCSVLine(headerLine, delimiter);

        // Create index map for columns
        const headerLower = headers.map(h => h.toLowerCase());
        const indices = {
            'Product Name': headerLower.indexOf('product name'),
            'Edition': headerLower.indexOf('edition'),
            'Primary Category': headerLower.indexOf('primary category'),
            'Secondary Category': headerLower.indexOf('secondary category'),
            'Tertiary Category': headerLower.indexOf('tertiary category'),
            'Quaternary Category': headerLower.indexOf('quaternary category'),
            'Notes': headerLower.indexOf('notes')
        };

        // Validate that required columns exist
        const requiredFields = ['Product Name', 'Primary Category'];
        for (const field of requiredFields) {
            if (indices[field] === -1) {
                console.warn(`Product category CSV missing required column: ${field}`);
                return [];
            }
        }

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.length === 0) continue;

            const values = parseCSVLine(line, delimiter);

            if (values.length < Object.keys(indices).filter(k => indices[k] !== -1).length) {
                console.warn(`Product category CSV row ${i + 1}: Not enough columns`);
                continue;
            }

            const product = {
                'Product Name': values[indices['Product Name']] || null,
                'Edition': values[indices['Edition']] || null,
                'Primary Category': values[indices['Primary Category']] || null,
                'Secondary Category': values[indices['Secondary Category']] || null,
                'Tertiary Category': values[indices['Tertiary Category']] || null,
                'Quaternary Category': values[indices['Quaternary Category']] || null,
                'Notes': values[indices['Notes']] || null
            };

            if (product['Product Name']) {
                products.push(product);
            }
        }

        return products;
    }

    /**
     * Load product category database from CSV
     * Fetches the FIFTY_BAR_FLAVOR_CATEGORIES.csv file and parses it
     * @returns {Promise<array>} - Promise that resolves to product array
     */
    async function loadProductCategoryDatabase() {
        try {
            const response = await fetch('/FIFTY_BAR_FLAVOR_CATEGORIES.csv');
            if (!response.ok) {
                console.error(`Failed to load product categories: ${response.status} ${response.statusText}`);
                return [];
            }

            const csvText = await response.text();
            const products = parseProductCategoryCSV(csvText);

            console.log(`Loaded ${products.length} products from category database`);
            return products;

        } catch (error) {
            console.error('Error loading product category database:', error);
            return [];
        }
    }

    // Public API
    return {
        validateCSV,
        generatePreview,
        validateClozeSyntax,
        renumberClozeFields,
        parseProductCategoryCSV,
        loadProductCategoryDatabase,
        CLOZE_REQUIRED_COLUMNS,
        REVERSE_REQUIRED_COLUMNS,
        OPTIONAL_COLUMNS
    };
})();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSVValidator;
}
