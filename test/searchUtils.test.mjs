import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeText,
    matchDevoteeName,
    searchDevoteesByName,
    highlightMatches
} from '../src/lib/searchUtils.js';

test('normalizeText handles whitespace and case conversion', () => {
    assert.equal(normalizeText('  Debabrata  '), 'debabrata');
    assert.equal(normalizeText('DEBABRATA SAHOO'), 'debabrata sahoo');
    assert.equal(normalizeText(''), '');
    assert.equal(normalizeText(null), '');
    assert.equal(normalizeText(undefined), '');
});

test('matchDevoteeName is strictly case-insensitive', () => {
    const devotee = {
        id: '1',
        name: 'Debabrata Sahoo',
        initiatedName: 'Damodar Das',
        contact: '918509696921'
    };

    // Lowercase query
    const resLower = matchDevoteeName(devotee, 'deb');
    assert.equal(resLower.matched, true);
    assert.equal(resLower.score, 95); // Prefix match

    // Uppercase query
    const resUpper = matchDevoteeName(devotee, 'DEB');
    assert.equal(resUpper.matched, true);
    assert.equal(resUpper.score, 95);

    // Mixed-case query
    const resMixed = matchDevoteeName(devotee, 'DeB');
    assert.equal(resMixed.matched, true);
    assert.equal(resMixed.score, 95);

    // Full name match
    assert.equal(matchDevoteeName(devotee, 'debabrata sahoo').score, 100);
    assert.equal(matchDevoteeName(devotee, 'DEBABRATA SAHOO').score, 100);

    // Initiated name prefix match
    assert.equal(matchDevoteeName(devotee, 'dam').matched, true);
    assert.equal(matchDevoteeName(devotee, 'DAM').matched, true);

    // Substring match in second word
    assert.equal(matchDevoteeName(devotee, 'sah').score, 85);
    assert.equal(matchDevoteeName(devotee, 'SAH').score, 85);
});

test('searchDevoteesByName prioritizes prefix matches first', () => {
    const devotees = [
        { id: '1', name: 'Sandip Deb', initiatedName: '' },
        { id: '2', name: 'Debabrata Sahoo', initiatedName: 'Damodar Das' },
        { id: '3', name: 'Debashis Roy', initiatedName: '' },
        { id: '4', name: 'Haridas Thakur', initiatedName: '' }
    ];

    // Search with lowercase 'deb'
    const resultsLower = searchDevoteesByName(devotees, 'deb');
    assert.equal(resultsLower.length, 3);
    // Names starting with 'Deb' should be top 2, Sandip Deb should be 3rd
    assert.equal(resultsLower[0].name.startsWith('Deb'), true);
    assert.equal(resultsLower[1].name.startsWith('Deb'), true);
    assert.equal(resultsLower[2].name, 'Sandip Deb');

    // Search with uppercase 'DEB'
    const resultsUpper = searchDevoteesByName(devotees, 'DEB');
    assert.deepEqual(
        resultsLower.map(d => d.id),
        resultsUpper.map(d => d.id)
    );

    // Partial prefix match: 'deba'
    const resultsPrefix = searchDevoteesByName(devotees, 'deba');
    assert.equal(resultsPrefix.length, 2);
    assert.ok(resultsPrefix.some(d => d.name === 'Debabrata Sahoo'));
    assert.ok(resultsPrefix.some(d => d.name === 'Debashis Roy'));
});

test('highlightMatches returns highlighted segments case-insensitively', () => {
    const text = 'Debabrata Sahoo';

    // Lowercase query
    const segs1 = highlightMatches(text, 'deb');
    assert.deepEqual(segs1, [
        { text: 'Deb', highlight: true },
        { text: 'abrata Sahoo', highlight: false }
    ]);

    // Uppercase query
    const segs2 = highlightMatches(text, 'DEB');
    assert.deepEqual(segs2, [
        { text: 'Deb', highlight: true },
        { text: 'abrata Sahoo', highlight: false }
    ]);

    // Middle word prefix match
    const segs3 = highlightMatches(text, 'sah');
    assert.deepEqual(segs3, [
        { text: 'Debabrata ', highlight: false },
        { text: 'Sah', highlight: true },
        { text: 'oo', highlight: false }
    ]);
});
