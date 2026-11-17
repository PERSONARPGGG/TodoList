/**
 * Daily-routine time math (pure functions).
 */
export const REPEAT_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Local "HH:MM" of a date — the clock time a daily routine repeats at. */
export function toRepeatAt(time) {
    const d = new Date(time);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function isValidRepeatAt(value) {
    return REPEAT_RE.test(value || '');
}

/**
 * Next run of a daily task strictly after `now` (today or tomorrow).
 * Uses `repeatAt` so a one-off delay ("+1H" today) doesn't shift every future day.
 */
export function nextOccurrence(task, now) {
    const clock = isValidRepeatAt(task.repeatAt) ? task.repeatAt : toRepeatAt(task.time);
    const [h, m] = clock.split(':').map(Number);
    const next = new Date(now);
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
}
