import { VAISHNAVA_EVENTS, FASTING_GUIDELINES } from '../data/vaishnavaCalendarData.js';

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export const toDateKey = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Parse YYYY-MM-DD into a Date object at midnight local time
 */
export const parseDateKey = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
};

/**
 * Get all events sorted chronologically
 */
export const getAllEvents = () => {
    return [...VAISHNAVA_EVENTS].sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get events for a specific year and month (1-indexed month: 1 for January, 12 for December)
 */
export const getEventsByMonth = (year, month) => {
    const monthStr = String(month).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    return VAISHNAVA_EVENTS.filter(e => e.date.startsWith(prefix))
        .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get the current or next Ekadashi relative to a reference date.
 * Also detects if today is an active Ekadashi day or Parana day!
 */
export const getNextEkadashi = (referenceDate = new Date()) => {
    const todayKey = toDateKey(referenceDate);
    const sorted = getAllEvents();

    // Check if today is Ekadashi
    const todayEkadashi = sorted.find(e => e.date === todayKey && e.type === 'ekadashi');

    // Check if today is Parana Day for any Ekadashi
    const todayParanaEvent = sorted.find(e => e.paranaDate === todayKey && e.paranaTime);

    // Find the next upcoming Ekadashi (today or in future)
    let nextEkadashi = sorted.find(e => e.date >= todayKey && e.type === 'ekadashi');
    if (!nextEkadashi) {
        // Fallback to the latest available if we reached past 2027
        nextEkadashi = sorted[sorted.length - 1];
    }

    const ekadashiDate = parseDateKey(nextEkadashi.date);
    const todayMidnight = parseDateKey(todayKey);
    const diffTime = ekadashiDate.getTime() - todayMidnight.getTime();
    const daysRemaining = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    return {
        nextEkadashi,
        daysRemaining,
        isTodayEkadashi: !!todayEkadashi,
        todayEkadashiEvent: todayEkadashi || null,
        isTodayParana: !!todayParanaEvent,
        todayParanaEvent: todayParanaEvent || null
    };
};

/**
 * Get the next N upcoming festivals & events
 */
export const getUpcomingVaishnavaEvents = (limit = 4, referenceDate = new Date()) => {
    const todayKey = toDateKey(referenceDate);
    const sorted = getAllEvents();
    return sorted
        .filter(e => e.date >= todayKey)
        .slice(0, limit);
};

/**
 * Search events across Bengali and English fields
 */
export const searchVaishnavaEvents = (query) => {
    if (!query || !query.trim()) return getAllEvents();
    const token = query.trim().toLowerCase();
    return getAllEvents().filter(e => {
        return (
            (e.name && e.name.toLowerCase().includes(token)) ||
            (e.bengaliName && e.bengaliName.toLowerCase().includes(token)) ||
            (e.mahatmyaEn && e.mahatmyaEn.toLowerCase().includes(token)) ||
            (e.mahatmyaBn && e.mahatmyaBn.toLowerCase().includes(token)) ||
            (e.type && e.type.toLowerCase().includes(token))
        );
    });
};

/**
 * Format a Parana notice string
 */
export const formatParanaNotice = (event, lang = 'bn') => {
    if (!event || !event.paranaTime) return '';
    if (lang === 'bn') {
        return `⏰ একাদশী পারণ সময়: ${event.paranaDate || 'পরের দিন'}, ${event.paranaTime} (মায়াপুর সময়)`;
    }
    return `⏰ Parana (Fast breaking) time: ${event.paranaDate || 'Next day'}, ${event.paranaTime} (Mayapur IST)`;
};

/**
 * Generates a devotional WhatsApp reminder text
 * Supports 'bilingual' (default), 'bn', and 'en'
 */
export const generateEkadashiWhatsAppText = (event, options = {}) => {
    const {
        language = 'bilingual',
        recipientName = '',
        templeName = 'ইস্কন শ্রীশ্রী রাধাগোবিন্দজিউ মন্দির'
    } = options;

    if (!event) return '';

    const nameGreeting = recipientName ? ` ${recipientName}` : '';

    if (language === 'bn') {
        return `🌸 *হরে কৃষ্ণ! প্রণাম গ্রহণ করবেন${nameGreeting}।* 🌸
🙏 *আসন্ন পবিত্র ${event.bengaliName}* 🙏

📅 *উপবাসের তারিখ:* ${event.date}
⏰ *পারণের সময় (পরের দিন):* ${event.paranaTime || 'সূর্যোদয়ের পর নিয়ম অনুযায়ী'}

🚫 *বর্জনীয়:* পঞ্চরবিশস্য (চাল, আটা, ডাল, গম, সুজি, সরিষার তেল ও তিল)।
✅ *গ্রহণীয়:* ফলমূল, দুধ, আলু, মিষ্টি আলু, সাবুদানা, শ্যামা চাল ও সৈন্ধব লবণ।

📖 *মাহাত্ম্য:*
"${event.mahatmyaBn}"

জয় শ্রীল প্রভুপাদ! শ্রীকৃষ্ণ আপনার ভক্তিপথে মঙ্গল করুন। 🌺
— ${templeName}`;
    }

    if (language === 'en') {
        return `🌸 *Hare Krishna! Please accept our humble obeisances${nameGreeting}.* 🌸
🙏 *Upcoming Holy ${event.name}* 🙏

📅 *Fasting Date:* ${event.date}
⏰ *Parana (Fast Break) Window:* ${event.paranaTime || 'Next morning after sunrise'}

🚫 *Fast Rules:* Avoid all grains and beans (rice, wheat, lentils, corn, mustard oil).
✅ *Allowed:* Fruits, milk, nuts, potatoes, sabudana, sama rice, rock salt.

📖 *Significance:*
"${event.mahatmyaEn}"

All glories to Srila Prabhupada! 🌺
— ${templeName}`;
    }

    // Default: Bilingual (both Bengali & English)
    return `🌸 *হরে কৃষ্ণ! Hare Krishna!* 🌸
প্রণাম গ্রহণ করবেন${nameGreeting} / Please accept humble obeisances.

🙏 *${event.bengaliName}*
🙏 *${event.name}*

📅 *তারিখ / Fasting Date:* ${event.date}
⏰ *পারণ সময় / Parana Window:* ${event.paranaTime || 'Next morning'} (মায়াপুর / Mayapur IST)

🚫 *নিয়ম / Fast Rules:*
পঞ্চরবিশস্য, ডাল ও শস্য বর্জনীয়। No grains or beans.
✅ ফল, দুধ, আলু, সাবুদানা গ্রহণীয়। Fruits, milk, sabudana allowed.

📖 *মহিমা / Significance:*
"${event.mahatmyaBn}"

শ্রীল প্রভুপাদের জয়! All glories to Srila Prabhupada! 🌺
— ${templeName}`;
};

export { FASTING_GUIDELINES };
