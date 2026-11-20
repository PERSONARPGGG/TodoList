/**
 * Daily briefing scheduler. This module only decides whether a briefing is due;
 * delivery remains injected so the scheduler is testable and DOM-free.
 */
import { STORAGE_KEYS } from '../config.js';
import { readString, writeString } from '../data/storage.js';

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function dayKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidBriefingTime(value) {
    return TIME_RE.test(value || '');
}

export function buildBriefing(tasks, now = new Date()) {
    const today = dayKey(now);
    const pending = tasks.filter(task => !task.completed && dayKey(new Date(task.time)) === today)
        .sort((a, b) => new Date(a.time) - new Date(b.time));
    return {
        date: today,
        count: pending.length,
        tasks: pending.map(task => ({ title: task.title, time: task.time }))
    };
}

export class DailyBriefingScheduler {
    constructor(store, deliver) {
        this.store = store;
        this.deliver = deliver;
    }

    check(now = new Date()) {
        const settings = this.store.getSettings();
        if (!settings.dailyBriefingEnabled || !isValidBriefingTime(settings.dailyBriefingTime)) return false;

        const [hour, minute] = settings.dailyBriefingTime.split(':').map(Number);
        const briefingTime = new Date(now);
        briefingTime.setHours(hour, minute, 0, 0);
        const today = dayKey(now);
        if (now < briefingTime || readString(STORAGE_KEYS.briefingSent) === today) return false;

        const briefing = buildBriefing(this.store.getTasks(), now);
        writeString(STORAGE_KEYS.briefingSent, today);
        this.deliver(briefing);
        return true;
    }
}
