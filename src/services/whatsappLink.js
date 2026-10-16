/**
 * WhatsApp Link & Dispatch Helper
 * Supports direct WhatsApp Web (web.whatsapp.com), WhatsApp App/Universal (wa.me),
 * Electron desktop shell integration, and popup blocker fallbacks.
 */

/**
 * Normalizes any phone number into a valid international format for WhatsApp.
 * Handles Indian numbers (10 digits -> prefixed with 91),
 * 11 digits starting with 0 (09876543210 -> 919876543210),
 * 12 digits starting with 91, or international numbers.
 */
export const sanitizeWhatsAppNumber = (raw) => {
    if (!raw) return '';
    let digits = String(raw).replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
    }
    if (digits.length === 10) {
        digits = '91' + digits;
    }
    return digits;
};

/**
 * Generates direct WhatsApp Web link (web.whatsapp.com)
 */
export const getWhatsAppWebUrl = (number, message = '') => {
    const cleanNumber = sanitizeWhatsAppNumber(number);
    return `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
};

/**
 * Generates universal WhatsApp deeplink (wa.me) for app/mobile
 */
export const getWhatsAppAppUrl = (number, message = '') => {
    const cleanNumber = sanitizeWhatsAppNumber(number);
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
};

/**
 * Safely opens WhatsApp either in WhatsApp Web or WhatsApp App.
 * Automatically detects Electron desktop environment and uses shell.openExternal.
 * If in a browser, handles popup blocker fallbacks.
 */
export const openWhatsApp = (number, message = '', mode = 'web') => {
    const cleanNumber = sanitizeWhatsAppNumber(number);
    if (!cleanNumber || cleanNumber.length < 10) {
        throw new Error('A valid 10-digit mobile number is required to open WhatsApp');
    }

    const targetUrl = mode === 'app'
        ? getWhatsAppAppUrl(cleanNumber, message)
        : getWhatsAppWebUrl(cleanNumber, message);

    // 1. Electron Desktop Support
    if (typeof window !== 'undefined' && window.electron?.shell?.openExternal) {
        window.electron.shell.openExternal(targetUrl);
        return { success: true, url: targetUrl };
    }

    // 2. Browser Environment with popup blocker fallback
    try {
        const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            const anchor = document.createElement('a');
            anchor.href = targetUrl;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
        }
    } catch {
        window.location.href = targetUrl;
    }

    return { success: true, url: targetUrl };
};
