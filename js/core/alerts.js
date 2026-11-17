/**
 * Alert scheduler (no DOM): decides WHEN a task should alert and remembers what already did.
 * Delivery (Notification / vibration) is injected, so this stays testable and UI-agnostic.
 */
import { STORAGE_KEYS, HOUR, MINUTE } from '../config.js';
import { readJSON, writeJSON } from '../data/storage.js';

/** Tasks overdue for longer than this are stale: marked silently, no catch-up spam at boot. */
export const STALE_ALERT_MS = HOUR;

export class AlertScheduler {
    /**
     * @param {import('../store.js').Store} store
     * @param {(title: string, minutesLeft: number|null) => void} deliver
     */
    constructor(store, deliver) {
        this.store = store;
        this.deliver = deliver;
        const saved = readJSON(STORAGE_KEYS.alerted, []);
        /** Keys `${id}|${time}|due|pre`; a delayed task gets fresh keys and alerts again. */
        this.keys = new Set(Array.isArray(saved) ? saved : []);
    }

    reset() {
        this.keys.clear();
        writeJSON(STORAGE_KEYS.alerted, []);
    }

    /** Check every pending task for a due alert and, if configured, a heads-up before it. */
    check(now = new Date()) {
        const tasks = this.store.getTasks();
        const leadMs = Math.max(0, Number(this.store.getSettings().notifyBeforeMinutes) || 0) * MINUTE;
        const nowMs = now.getTime();
        let changed = false;

        const once = (key, fire) => {
            if (this.keys.has(key)) return;
            this.keys.add(key);
            changed = true;
            fire();
        };

        tasks.forEach(task => {
            if (task.completed) return;
            const due = new Date(task.time).getTime();
            const base = `${task.id}|${task.time}`;

            if (due <= nowMs) {
                once(`${base}|due`, () => {
                    if (nowMs - due <= STALE_ALERT_MS) this.deliver(task.title, null);
                });
            } else if (leadMs > 0 && due - nowMs <= leadMs) {
                once(`${base}|pre`, () => this.deliver(task.title, Math.ceil((due - nowMs) / MINUTE)));
            }
        });

        if (changed) this._persist(tasks);
    }

    /** Prune keys of deleted/rescheduled tasks so storage doesn't grow forever. */
    _persist(tasks) {
        const live = new Set(tasks.map(t => `${t.id}|${t.time}`));
        this.keys = new Set([...this.keys].filter(k => live.has(k.slice(0, k.lastIndexOf('|')))));
        writeJSON(STORAGE_KEYS.alerted, [...this.keys]);
    }
}
