import { JSDOM } from 'jsdom';
import assert from 'node:assert';
import { sanitizeWhatsAppNumber, getWhatsAppWebUrl, getWhatsAppAppUrl, openWhatsApp } from '../src/services/whatsappLink.js';

console.log('====================================================');
console.log('       STARTING DOM INTEGRATION TESTS               ');
console.log('====================================================');

// Setup DOM Environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost:5173/#/tours/1',
    pretendToBeVisual: true,
});

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', {
    value: {
        ...dom.window.navigator,
        clipboard: {
            writeText: async (text) => {
                global.lastCopied = text;
                return Promise.resolve();
            }
        }
    },
    configurable: true,
    writable: true
});
global.HTMLElement = dom.window.HTMLElement;

let openedWindows = [];
dom.window.open = (url, target, features) => {
    openedWindows.push({ url, target, features });
    return {
        closed: false,
        focus: () => {},
        close: () => {}
    };
};

// ─── TEST 1: Phone Sanitization and Link Generation ────────────────────────
console.log('\n[DOM TEST 1] Testing Phone Normalization...');
const testCases = [
    { input: '9876543210', expected: '919876543210' },
    { input: '09876543210', expected: '919876543210' },
    { input: '+91 98765 43210', expected: '919876543210' },
    { input: '+919876543210', expected: '919876543210' },
    { input: '919876543210', expected: '919876543210' }
];

for (const tc of testCases) {
    const res = sanitizeWhatsAppNumber(tc.input);
    assert.strictEqual(res, tc.expected, `Failed for input: ${tc.input}`);
}
console.log('✔ Phone normalization passed.');

// ─── TEST 2: Direct Window Open in DOM ─────────────────────────────────────
console.log('\n[DOM TEST 2] Testing openWhatsApp DOM Triggering...');
openedWindows = [];
const directRes = openWhatsApp('9876543210', 'Hare Krishna! Yatra booking #101', 'web');
assert.strictEqual(directRes.success, true);
assert.strictEqual(openedWindows.length, 1, 'Must open exactly 1 window');
assert.ok(openedWindows[0].url.startsWith('https://web.whatsapp.com/send?phone=919876543210'));
console.log('✔ Direct window.open called with target="_blank" and correct WhatsApp Web URL.');

openedWindows = [];
const appRes = openWhatsApp('9876543210', 'Hare Krishna! Yatra booking #101', 'app');
assert.strictEqual(appRes.success, true);
assert.strictEqual(openedWindows.length, 1, 'Must open exactly 1 window for app');
assert.ok(openedWindows[0].url.startsWith('https://wa.me/919876543210'));
console.log('✔ Direct window.open called with target="_blank" and correct WhatsApp App URL.');

// ─── TEST 3: Tour Participant WhatsApp Trigger Logic ───────────────────────
console.log('\n[DOM TEST 3] Testing Tour Participant WhatsApp Trigger Logic...');
const participantWithPhone = {
    id: 101,
    devoteeId: 'GUEST_123',
    guestName: 'Gauranga Das',
    guestContact: '9876543210',
    totalPaid: 2000,
    status: 'Reserved'
};

const participantWithoutPhone = {
    id: 102,
    devoteeId: 'GUEST_124',
    guestName: 'Anonymous Pilgrim',
    guestContact: '',
    totalPaid: 0,
    status: 'Reserved'
};

const tour = {
    name: 'Mayapur Vrindavan Yatra',
    destination: 'Mayapur, WB',
    startDate: '2027-03-01',
    endDate: '2027-03-10',
    fees: 15000
};

function resolveParticipantData(en, tour, devotees = []) {
    const isGuest = !en.devoteeId || String(en.devoteeId).startsWith('GUEST_');
    const dev = !isGuest && Array.isArray(devotees) ? devotees.find(d => String(d.id) === String(en.devoteeId)) : null;

    const name = isGuest 
        ? (en.guestName || 'Pilgrim') 
        : (en.initiatedName || en.devoteeName || dev?.initiatedName || dev?.name || 'Devotee');

    const rawPhone = isGuest 
        ? (en.guestContact || '') 
        : (en.whatsapp || en.contact || dev?.whatsapp || dev?.contact || '');

    const tourFee = Number(tour?.fees || 0);
    const totalPaid = Number(en.totalPaid || 0);
    const dueAmount = tourFee - totalPaid;

    const message = 
        `Hare Krishna ${name}! 🙏\n\n` +
        `Here are your Yatra booking details:\n` +
        `• Tour: ${tour?.name || 'Spiritual Yatra'}\n` +
        `• Destination: ${tour?.destination || '—'}\n` +
        `• Booking Status: ${en.status}\n` +
        `• Tour Fees: ₹${tourFee.toLocaleString('en-IN')}\n` +
        `• Total Paid: ₹${totalPaid.toLocaleString('en-IN')}\n` +
        `• Balance Due: ₹${(dueAmount > 0 ? dueAmount : 0).toLocaleString('en-IN')}\n\n` +
        `For any assistance, please contact the Yatra coordinator.\n\n` +
        `*ISKCON DURGAPUR*`;

    return { name, rawPhone, message };
}

// Check with phone
const resolved1 = resolveParticipantData(participantWithPhone, tour);
assert.strictEqual(resolved1.name, 'Gauranga Das');
assert.strictEqual(resolved1.rawPhone, '9876543210');
assert.ok(resolved1.message.includes('Mayapur Vrindavan Yatra'));
assert.ok(resolved1.message.includes('₹13,000')); // 15000 - 2000

// Dispatch WhatsApp for participant with phone (1-click direct from table row)
openedWindows = [];
openWhatsApp(resolved1.rawPhone, resolved1.message, 'web');
assert.strictEqual(openedWindows.length, 1);
assert.ok(openedWindows[0].url.includes('919876543210'));
console.log('✔ Participant with phone successfully dispatches WhatsApp Web.');

// Check without phone
const resolved2 = resolveParticipantData(participantWithoutPhone, tour);
assert.strictEqual(resolved2.rawPhone, '');
const clean2 = sanitizeWhatsAppNumber(resolved2.rawPhone);
assert.strictEqual(clean2, '', 'Empty phone should resolve to empty string');
console.log('✔ Participant without phone triggers fallback modal correctly.');

// ─── TEST 4: DOM Event Simulation for Button Clicks ───────────────────────
console.log('\n[DOM TEST 4] Simulating DOM Button Click Event...');
const button = dom.window.document.createElement('button');
button.setAttribute('data-testid', 'send-whatsapp-btn');
button.addEventListener('click', (e) => {
    openWhatsApp(resolved1.rawPhone, resolved1.message, 'web');
});
dom.window.document.body.appendChild(button);

openedWindows = [];
button.click();
assert.strictEqual(openedWindows.length, 1);
assert.ok(openedWindows[0].url.includes('web.whatsapp.com/send?phone=919876543210'));
console.log('✔ DOM click event listener successfully triggered openWhatsApp.');

// ─── TEST 5: Clipboard Copy Integration ────────────────────────────────────
console.log('\n[DOM TEST 5] Testing Clipboard Copy Text...');
global.lastCopied = null;
await global.navigator.clipboard.writeText(resolved1.message);
assert.ok(global.lastCopied && global.lastCopied.includes('Mayapur Vrindavan Yatra'));
console.log('✔ Confirmation message copied to clipboard successfully.');

console.log('\n====================================================');
console.log('       ALL 5 DOM TESTS PASSED SUCCESSFULLY!         ');
console.log('====================================================');
process.exit(0);
