import { searchDevoteesByName, highlightMatches } from '../src/lib/searchUtils.js';
import assert from 'assert';

const testDevotees = [
    { id: '1', name: 'Sadananda Netai Gour Das (Sajal Pr)', initiatedName: '', contact: '9876543210' },
    { id: '2', name: 'Koushik Mukherjee', initiatedName: 'Kunja Madhav Das', contact: '9123456780' },
    { id: '3', name: 'Debabrata Sahoo', initiatedName: '', contact: '9000000001' },
    { id: '4', name: 'Mina Roy', initiatedName: 'MANGALA BHADRA Devi Dasi', contact: '9000000002' }
];

const tests = [
    { query: 'sadananda', expected: ['1'], desc: 'Lowercase exact word' },
    { query: 'SADA', expected: ['1'], desc: 'Uppercase partial letters' },
    { query: 'gour', expected: ['1'], desc: 'Middle word in full name' },
    { query: 'sajal', expected: ['1'], desc: 'Word inside parentheses' },
    { query: 'sadananda das', expected: ['1'], desc: 'Multi-word with middle words omitted' },
    { query: 'das sadananda', expected: ['1'], desc: 'Multi-word reversed order' },
    { query: 'kunja das', expected: ['2'], desc: 'Initiated name multi-word' },
    { query: 'mukherjee koushik', expected: ['2'], desc: 'Surname first, name second' },
    { query: 'deb', expected: ['3'], desc: 'Prefix letters' },
    { query: 'sahoo', expected: ['3'], desc: 'Surname only' },
    { query: 'mangala', expected: ['4'], desc: 'Initiated name uppercase in DB, lowercase query' },
    { query: 'devi dasi', expected: ['4'], desc: 'Title words in initiated name' }
];

tests.forEach(({ query, expected, desc }) => {
    const results = searchDevoteesByName(testDevotees, query).map(d => d.id);
    const passed = expected.every(id => results.includes(id));
    assert.ok(passed, `Failed ${desc}: expected ${expected} for "${query}", got ${results}`);
    console.log(`PASS: ${desc} ("${query}") -> ${results}`);
});

// Test highlighting
const hl = highlightMatches('Sadananda Netai Gour Das (Sajal Pr)', 'sada das');
assert.ok(hl.some(p => p.highlight && p.text.toLowerCase() === 'sada'));
assert.ok(hl.some(p => p.highlight && p.text.toLowerCase() === 'das'));
console.log('PASS: Highlight matches multi-token correctly');

console.log('\nAll search unit tests passed successfully!');
