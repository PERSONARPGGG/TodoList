import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from '../js/store.js';
import { UI } from '../js/ui.js';
import { i18n } from '../js/i18n.js';
import { DailyBriefingScheduler } from '../js/core/briefing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bodyHTML = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8')
    .match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];

const NOW = new Date('2026-11-13T14:00:00+09:00');
const at = (iso) => new Date(iso).toISOString();
let store;
let ui;

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    document.body.innerHTML = bodyHTML;
    i18n.setLang('EN');
    store = new Store();
    ui = new UI({ store });
});

afterEach(() => vi.useRealTimers());

describe('daily routines keep their clock time', () => {
    it('a one-off delay does not shift the next day', () => {
        const t = store.addTask({ title: 'brief', time: at('2026-11-13T15:00:00+09:00'), isDaily: true });
        expect(t.repeatAt).toBe('15:00');
        store.delayTask(t.id, 60);
        store.completeTask(t.id);

        vi.setSystemTime(new Date('2026-11-14T10:00:00+09:00'));
        const next = store.getTasks().find(x => x.id === t.id);
        expect(next.completed).toBe(false);
        expect(next.time).toBe(at('2026-11-14T15:00:00+09:00'));
    });

    it('legacy daily tasks without repeatAt get one derived from time', () => {
        localStorage.setItem('chronos_objectives', JSON.stringify([
            { id: 'x', title: 'old', time: at('2026-11-12T08:00:00+09:00'), isDaily: true, completed: false }
        ]));
        const [task] = store.getTasks();
        expect(task.repeatAt).toBe('08:00');
        expect(task.time).toBe(at('2026-11-14T08:00:00+09:00'));
    });
});

describe('alerts', () => {
    it('alert covers every overdue task, not only the prime one', () => {
        const spy = vi.spyOn(ui, 'triggerAlert').mockImplementation(() => {});
        store.addTask({ title: 'a', time: at('2026-11-13T13:50:00+09:00') });
        store.addTask({ title: 'b', time: at('2026-11-13T13:55:00+09:00') });
        ui.updateCountdown(store.getNextTask());
        ui.updateCountdown(store.getNextTask());
        expect(spy.mock.calls.map(c => c[0]).sort()).toEqual(['a', 'b']);
    });

    it('stale overdue tasks (> 1h) are marked silently', () => {
        const spy = vi.spyOn(ui, 'triggerAlert').mockImplementation(() => {});
        store.addTask({ title: 'ancient', time: at('2026-11-12T09:00:00+09:00') });
        ui.updateCountdown(store.getNextTask());
        expect(spy).not.toHaveBeenCalled();
    });

    it('sends a single heads-up alert within notifyBeforeMinutes', () => {
        const spy = vi.spyOn(ui, 'triggerAlert').mockImplementation(() => {});
        store.addTask({ title: 'soon', time: at('2026-11-13T14:08:00+09:00') });
        ui.updateCountdown(store.getNextTask());
        ui.updateCountdown(store.getNextTask());
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('soon', 8);
    });

    it('a delayed task alerts again at its new time', () => {
        const spy = vi.spyOn(ui, 'triggerAlert').mockImplementation(() => {});
        const t = store.addTask({ title: 'snooze', time: at('2026-11-13T13:59:00+09:00') });
        ui.updateCountdown(store.getNextTask());
        store.delayTask(t.id, 15);
        vi.setSystemTime(new Date('2026-11-13T14:16:00+09:00'));
        ui.updateCountdown(store.getNextTask());
        expect(spy.mock.calls.filter(c => c[1] === null || c[1] === undefined)).toHaveLength(2);
    });
});

describe('modal timers', () => {
    it('close then immediate reopen keeps the modal visible', () => {
        vi.useRealTimers();
        vi.useFakeTimers();
        const modal = document.getElementById('add-modal');
        ui.openModal(modal);
        vi.advanceTimersByTime(20);
        ui.closeModal(modal);
        ui.openModal(modal);
        vi.advanceTimersByTime(300);
        expect(modal.classList.contains('hidden')).toBe(false);
    });
});

describe('translations keep decorative markup', () => {
    it('prime directive diamond survives a language switch', () => {
        i18n.setLang('KR');
        ui.applyTranslations();
        const label = document.getElementById('label-prime-directive');
        expect(label.parentElement.querySelector('.rotate-45')).not.toBeNull();
        expect(label.textContent).toBe(i18n.t('primeDirective'));
    });
});

describe('app lifecycle', () => {
    it('does not accumulate visibility listeners when started more than once', async () => {
        globalThis.__CHRONOS_NO_AUTOBOOT__ = true;
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
        const { ChronosApp } = await import('../js/main.js');
        const app = new ChronosApp();
        const refresh = vi.spyOn(app.ui, 'refresh');

        app.start();
        app.start();
        refresh.mockClear();
        document.dispatchEvent(new Event('visibilitychange'));

        expect(refresh).toHaveBeenCalledTimes(1);
        app.stop();
        delete globalThis.__CHRONOS_NO_AUTOBOOT__;
    });
});

describe('daily briefing', () => {
    it('delivers once after the configured local time', () => {
        store.saveSettings({ dailyBriefingEnabled: true, dailyBriefingTime: '08:00' });
        store.addTask({ title: 'standup', time: at('2026-11-13T16:00:00+09:00') });
        const deliver = vi.fn();
        const scheduler = new DailyBriefingScheduler(store, deliver);

        expect(scheduler.check(new Date('2026-11-13T07:59:59+09:00'))).toBe(false);
        expect(scheduler.check(new Date('2026-11-13T08:00:00+09:00'))).toBe(true);
        expect(scheduler.check(new Date('2026-11-13T09:00:00+09:00'))).toBe(false);
        expect(deliver).toHaveBeenCalledTimes(1);
        expect(deliver.mock.calls[0][0].tasks[0].title).toBe('standup');
    });

    it('is opt-in and carries settings defaults forward', () => {
        expect(store.getSettings().dailyBriefingEnabled).toBe(false);
        expect(store.getSettings().dailyBriefingTime).toBe('08:00');
        expect(new DailyBriefingScheduler(store, vi.fn()).check(NOW)).toBe(false);
    });
});
