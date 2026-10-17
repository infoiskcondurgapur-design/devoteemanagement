import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getAllEvents,
    getEventsByMonth,
    getNextEkadashi,
    getUpcomingVaishnavaEvents,
    searchVaishnavaEvents,
    generateEkadashiWhatsAppText,
    toDateKey
} from '../src/lib/vaishnavaCalendarUtils.js';

test('Vaishnava Calendar Data Integrity', () => {
    const events = getAllEvents();
    assert.ok(events.length >= 35, `Expected at least 35 events, got ${events.length}`);

    // Verify all events have required fields
    for (const e of events) {
        assert.ok(e.id, 'Event missing id');
        assert.ok(e.name, `Event ${e.id} missing name`);
        assert.ok(e.bengaliName, `Event ${e.id} missing bengaliName`);
        assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/, `Event ${e.id} has invalid date format`);
        assert.ok(e.type, `Event ${e.id} missing type`);
        if (e.type === 'ekadashi') {
            assert.ok(e.paranaTime, `Ekadashi ${e.id} missing paranaTime`);
            assert.ok(e.paranaDate, `Ekadashi ${e.id} missing paranaDate`);
        }
    }
});

test('getEventsByMonth filters correctly', () => {
    const oct2026Events = getEventsByMonth(2026, 10);
    assert.ok(oct2026Events.length >= 2, 'Should have at least 2 events in October 2026');
    for (const e of oct2026Events) {
        assert.ok(e.date.startsWith('2026-10-'), `Event ${e.id} date does not start with 2026-10-`);
    }
});

test('getNextEkadashi accurately detects upcoming Ekadashi relative to Oct 17 2026', () => {
    const simDate = new Date(2026, 9, 17); // October 17, 2026
    const res = getNextEkadashi(simDate);

    assert.ok(res.nextEkadashi, 'Expected nextEkadashi to be found');
    assert.equal(res.nextEkadashi.name, 'Pasankusa Ekadashi');
    assert.equal(res.nextEkadashi.date, '2026-10-22');
    // Difference between Oct 17 and Oct 22 is 5 days
    assert.equal(res.daysRemaining, 5);
    assert.equal(res.isTodayEkadashi, false);
    assert.equal(res.isTodayParana, false);
});

test('getNextEkadashi detects today is Ekadashi', () => {
    const ekadashiDate = new Date(2026, 9, 22); // October 22, 2026 (Pasankusa Ekadashi)
    const res = getNextEkadashi(ekadashiDate);

    assert.equal(res.isTodayEkadashi, true);
    assert.equal(res.todayEkadashiEvent?.name, 'Pasankusa Ekadashi');
    assert.equal(res.daysRemaining, 0);
});

test('getNextEkadashi detects Parana day', () => {
    const paranaDate = new Date(2026, 9, 23); // October 23, 2026 (Parana for Pasankusa)
    const res = getNextEkadashi(paranaDate);

    assert.equal(res.isTodayParana, true);
    assert.equal(res.todayParanaEvent?.name, 'Pasankusa Ekadashi');
    assert.ok(res.todayParanaEvent?.paranaTime.includes('05:37 AM'));
});

test('searchVaishnavaEvents handles English and Bengali queries', () => {
    const resEn = searchVaishnavaEvents('Nirjala');
    assert.ok(resEn.length > 0, 'Should find Nirjala Ekadashi');
    assert.ok(resEn.some(e => e.name.includes('Nirjala')));

    const resBn = searchVaishnavaEvents('দামোদর');
    assert.ok(resBn.length > 0, 'Should find Damodara events in Bengali');

    const resPurana = searchVaishnavaEvents('ভীম');
    assert.ok(resPurana.length > 0, 'Should find events mentioning Bhima in Bengali');
});

test('generateEkadashiWhatsAppText formats messages properly', () => {
    const events = getAllEvents();
    const ekadashi = events.find(e => e.id === 'pasankusa-ekadashi-2026');
    assert.ok(ekadashi, 'Pasankusa Ekadashi must exist');

    const bilingualMsg = generateEkadashiWhatsAppText(ekadashi, {
        language: 'bilingual',
        recipientName: 'Prabhu'
    });
    assert.ok(bilingualMsg.includes('Prabhu'), 'Should include recipient name');
    assert.ok(bilingualMsg.includes('পাশাঙ্কুশা একাদশী'), 'Should include Bengali name');
    assert.ok(bilingualMsg.includes('Pasankusa Ekadashi'), 'Should include English name');
    assert.ok(bilingualMsg.includes('05:37 AM - 09:27 AM'), 'Should include Parana window');

    const bnMsg = generateEkadashiWhatsAppText(ekadashi, { language: 'bn' });
    assert.ok(bnMsg.includes('2026-10-22'));
    assert.ok(bnMsg.includes('উপবাসের তারিখ'));
    assert.ok(bnMsg.includes('পঞ্চরবিশস্য'));

    const enMsg = generateEkadashiWhatsAppText(ekadashi, { language: 'en' });
    assert.ok(enMsg.includes('2026-10-22'));
    assert.ok(enMsg.includes('Fasting Date'));
    assert.ok(enMsg.includes('Hare Krishna!'));
});
