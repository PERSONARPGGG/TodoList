/**
 * Task repository: CRUD, ordering, daily-routine rollover and productivity stats.
 */
import { STORAGE_KEYS, TASK_TYPES, MINUTE } from '../config.js';
import { uid, isSameDay, isValidDate, assignUniqueIds } from '../utils.js';
import { toRepeatAt, isValidRepeatAt, nextOccurrence } from '../core/recurrence.js';
import { readJSON, writeJSON } from './storage.js';

/** Pending first (earliest first), completed last. Sorts in place and returns the array. */
export function sortTasks(tasks) {
    return tasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.time) - new Date(b.time);
    });
}

/** Coerce an untrusted object (e.g. from a backup file) into a valid task, or null. */
export function normalizeTask(raw, id) {
    if (!raw || typeof raw.title !== 'string' || !raw.title.trim() || !isValidDate(raw.time)) return null;
    const task = {
        id,
        title: raw.title.trim(),
        time: new Date(raw.time).toISOString(),
        type: TASK_TYPES.includes(raw.type) ? raw.type : 'normal',
        isDaily: !!raw.isDaily,
        completed: !!raw.completed,
        completedAt: raw.completed && isValidDate(raw.completedAt) ? new Date(raw.completedAt).toISOString() : null,
        delayCount: Number.isFinite(raw.delayCount) ? Math.max(0, Math.floor(raw.delayCount)) : 0
    };
    if (task.isDaily) task.repeatAt = isValidRepeatAt(raw.repeatAt) ? raw.repeatAt : toRepeatAt(task.time);
    return task;
}

export class TaskRepository {
    constructor(key = STORAGE_KEYS.tasks) {
        this.key = key;
    }

    _read() {
        const data = readJSON(this.key, []);
        return Array.isArray(data) ? data : [];
    }

    save(tasks) {
        writeJSON(this.key, sortTasks(tasks));
    }

    /** Applies daily rollover, persists if anything changed, and returns sorted tasks. */
    getAll(now = new Date()) {
        const tasks = this._read();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        let changed = false;
        tasks.forEach(task => {
            if (!task.isDaily) return;
            if (!isValidRepeatAt(task.repeatAt)) {
                task.repeatAt = toRepeatAt(task.time);
                changed = true;
            }
            if (task.completed && task.completedAt) {
                const compDate = new Date(task.completedAt);
                if (compDate < now && !isSameDay(compDate, now)) {
                    task.completed = false;
                    task.completedAt = null;
                    task.time = nextOccurrence(task, now).toISOString();
                    changed = true;
                }
            } else if (!task.completed && new Date(task.time) < todayStart) {
                // Missed a previous day's run: roll forward instead of staying overdue forever.
                task.time = nextOccurrence(task, now).toISOString();
                changed = true;
            }
        });

        sortTasks(tasks);
        if (changed) this.save(tasks);
        return tasks;
    }

    /** Mutate one task through `fn`, then persist. Returns fn's result (or null if not found). */
    _mutate(id, fn) {
        const tasks = this.getAll();
        const task = tasks.find(t => t.id === id);
        if (!task) return null;
        const result = fn(task);
        this.save(tasks);
        return result === undefined ? task : result;
    }

    add(input) {
        const tasks = this.getAll();
        const task = normalizeTask({
            ...input,
            completed: false,
            completedAt: null,
            delayCount: 0
        }, uid());
        if (!task) return null;
        tasks.push(task);
        this.save(tasks);
        return task;
    }

    update(id, patch) {
        return this._mutate(id, task => {
            if (typeof patch.title === 'string' && patch.title.trim()) task.title = patch.title.trim();
            if (patch.time && isValidDate(patch.time)) task.time = new Date(patch.time).toISOString();
            if (TASK_TYPES.includes(patch.type)) task.type = patch.type;
            if (typeof patch.isDaily === 'boolean') task.isDaily = patch.isDaily;
            if (task.isDaily && (patch.time || patch.isDaily)) task.repeatAt = toRepeatAt(task.time);
            if (!task.isDaily) delete task.repeatAt;
        });
    }

    remove(id) {
        this.save(this.getAll().filter(t => t.id !== id));
    }

    /** Remove completed tasks in one operation and return the number removed. */
    removeCompleted() {
        const tasks = this.getAll();
        const remaining = tasks.filter(task => !task.completed);
        const removed = tasks.length - remaining.length;
        if (removed > 0) this.save(remaining);
        return removed;
    }

    complete(id) {
        this._mutate(id, task => {
            task.completed = true;
            task.completedAt = new Date().toISOString();
        });
    }

    uncomplete(id) {
        this._mutate(id, task => {
            task.completed = false;
            task.completedAt = null;
        });
    }

    /** Push the task back by `minutes` from max(its time, now). Returns the new ISO time. */
    delay(id, minutes) {
        return this._mutate(id, task => {
            const now = new Date();
            const base = new Date(task.time) > now ? new Date(task.time) : now;
            task.time = new Date(base.getTime() + minutes * MINUTE).toISOString();
            task.delayCount = (task.delayCount || 0) + 1;
            return task.time;
        });
    }

    next() {
        return this.getAll().find(t => !t.completed) || null;
    }

    /** Give every task a unique id (v0.5.0 and earlier could produce duplicates). */
    repairIds() {
        const tasks = this._read();
        if (assignUniqueIds(tasks)) this.save(tasks);
    }

    stats() {
        const tasks = this.getAll();
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const totalDelays = tasks.reduce((sum, t) => sum + (t.delayCount || 0), 0);
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;

        let grade = 'S';
        if (completionRate < 60 || totalDelays > 5) grade = 'C';
        else if (completionRate < 80 || totalDelays > 2) grade = 'B';
        else if (completionRate < 95 || totalDelays > 0) grade = 'A';

        return { total, completed, pending: total - completed, totalDelays, completionRate, grade };
    }
}
