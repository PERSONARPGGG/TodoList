import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Store, APP_VERSION } from '../js/store.js';

const NOW = new Date('2026-11-13T14:00:00+09:00');
const iso = (s) => new Date(s).toISOString();

let store;
beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    store = new Store();
});
afterEach(() => {
    vi.useRealTimers();
});

const importTasks = (tasks, extra = {}) =>
    store.importData(JSON.stringify({ tasks, ...extra }));

describe('addTask / deleteTask', () => {
    it('two addTask calls in the same ms produce different ids', () => {
        const a = store.addTask({ title: 'A', time: iso('2026-11-13T15:00:00+09:00') });
        const b = store.addTask({ title: 'B', time: iso('2026-11-13T15:00:00+09:00') });
        expect(a.id).not.toBe(b.id);
        expect(store.getTasks()).toHaveLength(2);
    });

    it('deleteTask removes exactly one task', () => {
        const a = store.addTask({ title: 'A', time: iso('2026-11-13T15:00:00+09:00') });
        store.addTask({ title: 'B', time: iso('2026-11-13T15:00:00+09:00') });
        store.deleteTask(a.id);
        const left = store.getTasks();
        expect(left).toHaveLength(1);
        expect(left[0].title).toBe('B');
    });

    it('clearCompletedTasks removes only completed tasks', () => {
        const done = store.addTask({ title: 'done', time: iso('2026-11-13T15:00:00+09:00') });
        store.addTask({ title: 'pending', time: iso('2026-11-13T16:00:00+09:00') });
        store.completeTask(done.id);
        expect(store.clearCompletedTasks()).toBe(1);
        expect(store.getTasks().map(t => t.title)).toEqual(['pending']);
        expect(store.clearCompletedTasks()).toBe(0);
    });

    it('rejects invalid task input at the repository boundary', () => {
        expect(store.addTask({ title: '   ', time: 'not-a-date' })).toBeNull();
        expect(store.getTasks()).toEqual([]);
    });
});

describe('links', () => {
    it('rejects empty portal input instead of persisting a null row', () => {
        expect(store.addLink('', 'DEV', 'https://example.com')).toBeNull();
        expect(store.addLink('Example', 'DEV', '')).toBeNull();
        expect(store.getLinks().every(Boolean)).toBe(true);
    });
});

describe('ordering', () => {
    const unsorted = [
        { id: 'c1', title: 'done-early', time: iso('2026-11-13T15:00:00+09:00'), completed: true, completedAt: iso('2026-11-13T13:00:00+09:00') },
        { id: 'p2', title: 'late', time: iso('2026-11-14T10:00:00+09:00'), completed: false },
        { id: 'p1', title: 'early', time: iso('2026-11-13T16:00:00+09:00'), completed: false },
    ];

    it('getTasks is always sorted: pending by time asc, then completed', () => {
        expect(importTasks(unsorted)).toBe(true);
        expect(store.getTasks().map(t => t.id)).toEqual(['p1', 'p2', 'c1']);
    });

    it('getNextTask returns earliest pending even with unsorted imported data', () => {
        importTasks(unsorted);
        expect(store.getNextTask()?.id).toBe('p1');
    });
});

describe('importData validation', () => {
    beforeEach(() => {
        store.addTask({ title: 'existing', time: iso('2026-11-13T18:00:00+09:00') });
    });
    const snapshot = () => ({ tasks: store.getTasks(), links: store.getLinks() });

    it('invalid JSON -> false and data unchanged', () => {
        const before = snapshot();
        expect(store.importData('{not json')).toBe(false);
        expect(snapshot()).toEqual(before);
    });

    it('tasks present but not an array -> false and unchanged', () => {
        const before = snapshot();
        expect(store.importData(JSON.stringify({ tasks: { a: 1 } }))).toBe(false);
        expect(snapshot()).toEqual(before);
    });

    it('links present but not an array -> false and unchanged', () => {
        const before = snapshot();
        expect(store.importData(JSON.stringify({ tasks: [], links: 'oops' }))).toBe(false);
        expect(snapshot()).toEqual(before);
    });

    it('filters invalid task entries (title string + valid time required)', () => {
        const ok = importTasks([
            { id: 'ok', title: 'ok', time: iso('2026-11-13T15:00:00+09:00') },
            { id: 'n1', title: 123, time: iso('2026-11-13T15:00:00+09:00') },
            { id: 'n2', title: 'bad time', time: 'not-a-date' },
            { id: 'n3', time: iso('2026-11-13T15:00:00+09:00') },
            { id: 'n4', title: 'no time' },
            null,
            'string',
        ]);
        expect(ok).toBe(true);
        expect(store.getTasks().map(t => t.title)).toEqual(['ok']);
    });

    it('link urls are passed through safeUrl', () => {
        importTasks([], {
            links: [
                { id: 'x', title: 'evil', category: 'DEV', url: 'javascript:alert(1)' },
                { id: 'y', title: 'bare', category: 'DEV', url: 'example.com' },
            ],
        });
        const links = store.getLinks();
        expect(links.find(l => l.id === 'x')?.url).toBe('#');
        expect(links.find(l => l.id === 'y')?.url).toMatch(/^https:\/\/example\.com\/?$/);
    });
});

describe('daily routines', () => {
    it('daily completed on the same date LAST YEAR resets', () => {
        importTasks([{
            id: 'd', title: 'brief', isDaily: true, completed: true,
            time: iso('2025-11-13T08:00:00+09:00'),
            completedAt: iso('2025-11-13T08:05:00+09:00'),
        }]);
        const t = store.getTasks().find(x => x.id === 'd');
        expect(t.completed).toBe(false);
        expect(t.time).toBe(iso('2026-11-14T08:00:00+09:00'));
    });

    it('daily completed yesterday resets to next occurrence (today if not passed)', () => {
        importTasks([{
            id: 'd', title: 'evening', isDaily: true, completed: true,
            time: iso('2026-11-12T20:00:00+09:00'),
            completedAt: iso('2026-11-12T20:10:00+09:00'),
        }]);
        const t = store.getTasks().find(x => x.id === 'd');
        expect(t.completed).toBe(false);
        expect(t.time).toBe(iso('2026-11-13T20:00:00+09:00'));
    });

    it('daily completed today stays completed', () => {
        importTasks([{
            id: 'd', title: 'brief', isDaily: true, completed: true,
            time: iso('2026-11-13T08:00:00+09:00'),
            completedAt: iso('2026-11-13T08:05:00+09:00'),
        }]);
        expect(store.getTasks().find(x => x.id === 'd').completed).toBe(true);
    });

    it('pending daily with stale time rolls over to today (slot not yet passed)', () => {
        importTasks([{ id: 'd', title: 'gym', isDaily: true, completed: false, time: iso('2026-11-10T20:00:00+09:00') }]);
        expect(store.getTasks().find(x => x.id === 'd').time).toBe(iso('2026-11-13T20:00:00+09:00'));
    });

    it('pending daily with stale time rolls over to tomorrow if today slot passed', () => {
        importTasks([{ id: 'd', title: 'jog', isDaily: true, completed: false, time: iso('2026-11-10T09:00:00+09:00') }]);
        expect(store.getTasks().find(x => x.id === 'd').time).toBe(iso('2026-11-14T09:00:00+09:00'));
    });
});

describe('delayTask', () => {
    it('past task: time = now + m, delayCount + 1', () => {
        const t = store.addTask({ title: 'late', time: iso('2026-11-13T12:00:00+09:00') });
        store.delayTask(t.id, 15);
        const u = store.getTasks().find(x => x.id === t.id);
        expect(u.time).toBe(iso('2026-11-13T14:15:00+09:00'));
        expect(u.delayCount).toBe(1);
    });

    it('future task: time = time + m, delayCount accumulates', () => {
        const t = store.addTask({ title: 'soon', time: iso('2026-11-13T15:00:00+09:00') });
        store.delayTask(t.id, 15);
        store.delayTask(t.id, 60);
        const u = store.getTasks().find(x => x.id === t.id);
        expect(u.time).toBe(iso('2026-11-13T16:15:00+09:00'));
        expect(u.delayCount).toBe(2);
    });
});

describe('export / stats', () => {
    it('exportAllData version matches APP_VERSION', () => {
        expect(JSON.parse(store.exportAllData()).version).toBe(APP_VERSION);
    });

it('getStats with 0 tasks -> completionRate 100', () => {
        const s = store.getStats();
        expect(s.total).toBe(0);
        expect(s.completionRate).toBe(100);
    });
});
