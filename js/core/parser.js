/**
 * NLP Fast Parser (pure function — no storage, no DOM).
 * Korean / English quick-entry text → { title, time (ISO), isDaily }.
 */
import { HOUR, MINUTE } from '../config.js';
import { isSameDay } from '../utils.js';

/**
 * Parses natural language input (Korean/English) into task title, target ISO time, and isDaily flag.
 * - "매일 08:00 아침 브리핑" -> { title: "아침 브리핑", isDaily: true, time: next 08:00 }
 * - "30분 뒤 코드 검토" / "+30m review" / "in 30 min review" -> +30 minutes
 * - "1시간 30분 뒤 운동" / "1h 30m workout" -> +90 minutes
 * - "내일 14:00 회의" / "tomorrow 3pm call" / "오후 3시 미팅" -> absolute time
 * Bare numbers ("Review 3 PRs", "2026 계획") are never treated as times.
 */
export function parseQuickInput(text, now = new Date()) {
    // Pad with spaces so every token has a whitespace boundary on both sides.
    let s = ` ${String(text).trim().replace(/\s+/g, ' ')} `;
    const take = (re) => {
        const m = s.match(re);
        if (m) s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length);
        return m;
    };

    // 1. Recurrence
    const isDaily = !!take(/(?<=\s)(?:매일|daily|everyday|every day)(?=\s)/i);

    // 2. Day offset (Korean words may be glued to the next word, e.g. "내일회의")
    let dayOffset = 0;
    if (take(/(?<=\s)(?:모레|day after tomorrow)(?=\s)/i) || take(/(?<=\s)모레/)) dayOffset = 2;
    else if (take(/(?<=\s)(?:내일|tomorrow|tmrw?)(?=\s)/i) || take(/(?<=\s)내일/)) dayOffset = 1;
    else take(/(?<=\s)(?:오늘|today)(?=\s)/i);

    // 3. Relative offsets
    let relativeMs = null;
    const toMs = (h, m) => (parseInt(h || '0', 10) * HOUR) + (parseInt(m || '0', 10) * MINUTE);
    const koRel = take(/(?<=\s)(?:(\d+)\s*시간(?:\s*(\d+)\s*분)?|(\d+)\s*분)\s*(?:뒤|후)(?:에)?(?=\s)/);
    if (koRel) {
        relativeMs = toMs(koRel[1], koRel[2] || koRel[3]);
    } else {
        const H = '(?:h|hrs?|hours?)';
        const M = '(?:m|mins?|minutes?)';
        const enRel = take(new RegExp(
            `(?<=\\s)(?:in\\s+)?\\+?(?:(\\d+)\\s*${H}(?:\\s*(\\d+)\\s*${M})?|(\\d+)\\s*${M})(?:\\s+(?:later|from now))?(?=\\s)`, 'i'
        ));
        if (enRel) relativeMs = toMs(enRel[1], enRel[2] || enRel[3]);
    }

    // 4. Absolute clock time (only when no relative offset)
    let clock = null; // { hour, minute, explicitMeridiem }
    if (relativeMs === null) {
        const applyMeridiem = (hour, mer) => {
            if (!mer) return hour;
            const pm = /^(오후|pm)$/i.test(mer);
            if (hour === 12) return pm ? 12 : 0;
            return pm ? hour + 12 : hour;
        };

        const en = take(/(?<=\s)(\d{1,2})(?::([0-5]\d))?\s*(am|pm)(?=\s)/i);
        const hhmm = !en && take(/(?<=\s)(오전|오후)?\s*([01]?\d|2[0-3]):([0-5]\d)(?:에)?(?=\s)/);
        const ko = !en && !hhmm && take(/(?<=\s)(오전|오후)?\s*(\d{1,2})\s*시(?!간)(?:\s*(\d{1,2})\s*분|\s*(반))?(?:에)?/);

        if (en) {
            const h = parseInt(en[1], 10);
            if (h >= 1 && h <= 12) clock = { hour: applyMeridiem(h, en[3]), minute: parseInt(en[2] || '0', 10), explicit: true };
        } else if (hhmm) {
            const h = parseInt(hhmm[2], 10);
            if (!hhmm[1] || h <= 12) clock = { hour: applyMeridiem(h, hhmm[1]), minute: parseInt(hhmm[3], 10), explicit: true };
        } else if (ko) {
            const h = parseInt(ko[2], 10);
            const min = ko[4] ? 30 : parseInt(ko[3] || '0', 10);
            const valid = ko[1] ? (h >= 1 && h <= 12) : h <= 24;
            if (valid && min <= 59) {
                clock = { hour: applyMeridiem(h % 24, ko[1]), minute: min, explicit: !!ko[1] || h > 12 || h === 0 };
            }
        }
    }

    // 5. Resolve target time
    let target;
    if (relativeMs !== null) {
        target = new Date(now.getTime() + relativeMs + dayOffset * 24 * HOUR);
    } else if (clock) {
        target = new Date(now);
        target.setDate(target.getDate() + dayOffset);
        target.setHours(clock.hour, clock.minute, 0, 0);
        if (dayOffset === 0 && target <= now) {
            // "3시 미팅" at 14:00 most likely means 15:00, not 03:00 tomorrow.
            const pmGuess = new Date(target.getTime() + 12 * HOUR);
            if (!clock.explicit && clock.hour < 12 && pmGuess > now && isSameDay(pmGuess, now)) {
                target = pmGuess;
            } else {
                target.setDate(target.getDate() + 1);
            }
        }
    } else if (dayOffset > 0) {
        target = new Date(now);
        target.setDate(target.getDate() + dayOffset);
        target.setHours(9, 0, 0, 0);
    } else if (isDaily) {
        target = new Date(now);
        target.setHours(8, 0, 0, 0);
        if (target <= now) target.setDate(target.getDate() + 1);
    } else {
        target = new Date(now.getTime() + HOUR);
    }

    const title = s.replace(/\s+/g, ' ').trim();
    return {
        title: title || 'Quick Objective',
        time: target.toISOString(),
        isDaily
    };
}
