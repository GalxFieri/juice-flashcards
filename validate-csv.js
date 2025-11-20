/**
 * CSV Validation Module for Juice/Vape Product Cards
 * Validates CSV format, required fields, and data integrity
 */

const CSVValidator = (function() {
    'use strict';

    // Required columns for card CSVs
    const REQUIRED_COLUMNS = ['id', 'question', 'answer'];

    // Optional columns
    const OPTIONAL_COLUMNS = ['category', 'tags', 'difficulty'];

    /**
     * Validate CSV format and structure
     * @param {string} csvText - Raw CSV text content
     * @returns {object} - { valid: boolean, errors: [], warnings: [], data: [] }
     */
    function validateCSV(csvText) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            data: [],
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

            // Validate headers
            const headerValidation = validateHeaders(headers);
            if (!headerValidation.valid) {
                result.valid = false;
                result.errors.push(...headerValidation.errors);
                return result;
            }

            result.warnings.push(...headerValidation.warnings);

            // Get column indices
            const columnIndices = getColumnIndices(headers);

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
                const rowValidation = validateRow(values, columnIndices, i + 1);

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

                // Add valid row
                result.data.push({
                    id: values[columnIndices.id],
                    question: values[columnIndices.question],
                    answer: values[columnIndices.answer],
                    category: columnIndices.category !== -1 ? values[columnIndices.category] : null,
                    tags: columnIndices.tags !== -1 ? values[columnIndices.tags] : null,
                    difficulty: columnIndices.difficulty !== -1 ? values[columnIndices.difficulty] : 'Medium',
                    rowNumber: i + 1
                });

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
     * @returns {object} - { valid: boolean, errors: [], warnings: [] }
     */
    function validateHeaders(headers) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check required columns
        const headerLower = headers.map(h => h.toLowerCase());

        for (const required of REQUIRED_COLUMNS) {
            if (!headerLower.includes(required.toLowerCase())) {
                result.valid = false;
                result.errors.push(`Missing required column: "${required}"`);
            }
        }

        // Check for unknown columns
        const knownColumns = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].map(c => c.toLowerCase());
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
     * @returns {object} - { id: int, question: int, answer: int, ... }
     */
    function getColumnIndices(headers) {
        const indices = {};
        const headerLower = headers.map(h => h.toLowerCase());

        const allColumns = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
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
     * @returns {object} - { valid: boolean, errors: [] }
     */
    function validateRow(values, columnIndices, rowNumber) {
        const result = {
            valid: true,
            errors: []
        };

        // Check if we have enough columns
        const requiredIndices = [columnIndices.id, columnIndices.question, columnIndices.answer];
        const maxIndex = Math.max(...requiredIndices);

        if (values.length <= maxIndex) {
            result.valid = false;
            result.errors.push(`Row ${rowNumber}: Not enough columns. Expected at least ${maxIndex + 1}, got ${values.length}`);
            return result;
        }

        // Validate required fields are not empty
        if (!values[columnIndices.id] || values[columnIndices.id].trim() === '') {
            result.valid = false;
            result.errors.push(`Row ${rowNumber}: Card ID is empty`);
        }

        if (!values[columnIndices.question] || values[columnIndices.question].trim() === '') {
            result.valid = false;
            result.errors.push(`Row ${rowNumber}: Question is empty`);
        }

        if (!values[columnIndices.answer] || values[columnIndices.answer].trim() === '') {
            result.valid = false;
            result.errors.push(`Row ${rowNumber}: Answer is empty`);
        }

        // Validate ID format (alphanumeric + underscore, no spaces)
        const idValue = values[columnIndices.id];
        if (!/^[a-zA-Z0-9_-]+$/.test(idValue)) {
            result.valid = false;
            result.errors.push(`Row ${rowNumber}: Invalid card ID format "${idValue}". Use only letters, numbers, underscores, and hyphens`);
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

        let html = '<table style="border-collapse: collapse; width: 100%; font-size: 12px;">';
        html += '<tr style="background-color: #f0f0f0;"><th style="border: 1px solid #ddd; padding: 8px;">ID</th><th style="border: 1px solid #ddd; padding: 8px;">Question</th><th style="border: 1px solid #ddd; padding: 8px;">Answer</th></tr>';

        const rowsToShow = validationResult.data.slice(0, maxRows);
        for (const row of rowsToShow) {
            html += `<tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(row.id)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(row.question)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(row.answer)}</td>
            </tr>`;
        }

        if (validationResult.data.length > maxRows) {
            html += `<tr><td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: center; font-style: italic;">
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

    // Public API
    return {
        validateCSV,
        generatePreview,
        REQUIRED_COLUMNS,
        OPTIONAL_COLUMNS
    };
})();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSVValidator;
}
