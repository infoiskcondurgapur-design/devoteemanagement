import React from 'react';

/**
 * Normalizes text for case-insensitive and accent-safe matching.
 * Trims extra spaces and converts to lowercase.
 */
export const normalizeText = (text) => {
    if (!text) return '';
    return String(text)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Scores a devotee record against a search query.
 * Prioritizes:
 * 1. Exact match (Score 100/98)
 * 2. Query prefix match (Score 95/90)
 * 3. Contiguous substring match anywhere in name (Score 85/80)
 * 4. Token-based match: matches any words/letters from anywhere in the devotee's
 *    name, initiated/spiritual name, contact, or email in any order (Score 75/65)
 *
 * @param {Object} devotee - Devotee object
 * @param {string} query - Raw search query string
 * @returns {{ matched: boolean, score: number, matchField: string|null }}
 */
export const matchDevoteeName = (devotee, query) => {
    const q = normalizeText(query);
    if (!q) return { matched: true, score: 0, matchField: null };

    const name = normalizeText(devotee.name);
    const initiatedName = normalizeText(devotee.initiatedName || devotee.spiritualName);
    const contact = normalizeText(devotee.contact || devotee.whatsapp || devotee.phone);
    const email = normalizeText(devotee.email);

    // 1. Exact match (Score 100)
    if (name === q) return { matched: true, score: 100, matchField: 'name' };
    if (initiatedName === q) return { matched: true, score: 98, matchField: 'initiatedName' };

    // 2. Name starts with query prefix (Score 95) - e.g. "deb" -> "Debabrata Sahoo"
    if (name.startsWith(q)) return { matched: true, score: 95, matchField: 'name' };
    if (initiatedName.startsWith(q)) return { matched: true, score: 90, matchField: 'initiatedName' };

    // 3. Whole query is contiguous substring anywhere in name (Score 85) - e.g. "sahoo" -> "Debabrata Sahoo"
    if (name.includes(q)) return { matched: true, score: 85, matchField: 'name' };
    if (initiatedName.includes(q)) return { matched: true, score: 80, matchField: 'initiatedName' };

    // 4. Token-based matching: handles multiple words in any order, middle words, or separate tokens
    // e.g. "sadananda das" -> "Sadananda Netai Gour Das (Sajal Pr)"
    // e.g. "mukherjee koushik" -> "Koushik Mukherjee"
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
        const nameWords = name.split(/[\s()[\],.\-_/]+/).filter(Boolean);
        const initWords = initiatedName.split(/[\s()[\],.\-_/]+/).filter(Boolean);
        const allWords = [...nameWords, ...initWords];

        const allTokensMatch = tokens.every(token => 
            name.includes(token) || 
            initiatedName.includes(token) || 
            (contact && contact.includes(token.replace(/\s+/g, ''))) || 
            (email && email.includes(token))
        );

        if (allTokensMatch) {
            // Check if every token starts at the beginning of some word in the devotee's name
            const allWordPrefix = tokens.every(token => allWords.some(w => w.startsWith(token)));
            const score = allWordPrefix ? 75 : 65;
            return { matched: true, score, matchField: 'name' };
        }
    }

    // 5. Contact / WhatsApp phone match (Score 40)
    if (contact && contact.includes(q.replace(/\s+/g, ''))) {
        return { matched: true, score: 40, matchField: 'contact' };
    }

    // 6. Email match (Score 35)
    if (email && email.includes(q)) {
        return { matched: true, score: 35, matchField: 'email' };
    }

    return { matched: false, score: 0, matchField: null };
};

/**
 * Searches a list of devotees case-insensitively with prefix prioritization.
 *
 * @param {Array} devotees - Array of devotee objects
 * @param {string} query - Search term entered by user
 * @param {Object} options - { limit: number, returnAllWhenEmpty: boolean }
 * @returns {Array} Sorted matching devotee objects
 */
export const searchDevoteesByName = (devotees, query, options = {}) => {
    if (!Array.isArray(devotees)) return [];
    const q = normalizeText(query);
    if (!q) {
        return options.returnAllWhenEmpty !== false ? devotees : [];
    }

    const matches = [];
    for (let i = 0; i < devotees.length; i++) {
        const devotee = devotees[i];
        if (!devotee) continue;
        const res = matchDevoteeName(devotee, q);
        if (res.matched) {
            matches.push({
                devotee,
                score: res.score,
                matchField: res.matchField
            });
        }
    }

    // Sort: highest relevance score first, then alphabetical by name
    matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const nameA = String(a.devotee?.name || '').toLowerCase();
        const nameB = String(b.devotee?.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });

    const results = matches.map(m => m.devotee);
    if (options.limit && options.limit > 0) {
        return results.slice(0, options.limit);
    }
    return results;
};

/**
 * Splits text into highlighted and unhighlighted segments based on query matches.
 * Case-insensitive and supports multiple search tokens anywhere in the text.
 *
 * @param {string} text - The original text to display
 * @param {string} query - The search query string
 * @returns {Array<{ text: string, highlight: boolean }>}
 */
export const highlightMatches = (text, query) => {
    if (!text) return [{ text: '', highlight: false }];
    const str = String(text);
    const q = normalizeText(query);
    if (!q) return [{ text: str, highlight: false }];

    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [{ text: str, highlight: false }];

    const lower = str.toLowerCase();
    const intervals = [];

    // Find all match locations for all tokens
    tokens.forEach(token => {
        let idx = lower.indexOf(token);
        while (idx !== -1) {
            intervals.push([idx, idx + token.length]);
            idx = lower.indexOf(token, idx + 1);
        }
    });

    if (intervals.length === 0) {
        return [{ text: str, highlight: false }];
    }

    // Sort intervals by start position, then longer duration first
    intervals.sort((a, b) => a[0] - b[0] || b[1] - a[1]);

    // Merge overlapping and contiguous intervals
    const merged = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
        const prev = merged[merged.length - 1];
        const curr = intervals[i];
        if (curr[0] <= prev[1]) {
            prev[1] = Math.max(prev[1], curr[1]);
        } else {
            merged.push(curr);
        }
    }

    // Build parts
    const parts = [];
    let lastIndex = 0;
    merged.forEach(([start, end]) => {
        if (start > lastIndex) {
            parts.push({
                text: str.substring(lastIndex, start),
                highlight: false
            });
        }
        parts.push({
            text: str.substring(start, end),
            highlight: true
        });
        lastIndex = end;
    });

    if (lastIndex < str.length) {
        parts.push({
            text: str.substring(lastIndex),
            highlight: false
        });
    }

    return parts;
};

/**
 * Reusable React component that displays text with matched search terms highlighted.
 */
export const HighlightText = ({ text, query, className = '', highlightClassName = 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-bold px-0.5 rounded' }) => {
    if (!text) return null;
    if (!query) return React.createElement('span', { className }, text);

    const segments = highlightMatches(text, query);
    return React.createElement(
        'span',
        { className },
        segments.map((seg, idx) => (
            seg.highlight
                ? React.createElement('mark', { key: idx, className: highlightClassName }, seg.text)
                : React.createElement('span', { key: idx }, seg.text)
        ))
    );
};

export default {
    normalizeText,
    matchDevoteeName,
    searchDevoteesByName,
    highlightMatches,
    HighlightText
};
