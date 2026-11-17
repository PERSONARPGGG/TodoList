import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from '../js/store.js';
import { UI } from '../js/ui.js';
import { i18n } from '../js/i18n.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
// Body only; <script> tags inserted via innerHTML never execute (Tailwind CDN / SW / main.js ignored).
const bodyHTML = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];

// jsdom has no real innerText; read whichever the code wrote.
const text = (el) => `${el?.textContent ?? ''} ${el?.innerText ?? ''}`;

let store, ui, app;

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-13T14:00:00+09:00'));
    localStorage.clear();
    document.body.innerHTML = bodyHTML;
    i18n.setLang('EN');
    store = new Store();
    app = { store };
    ui = new UI(app);
    app.ui = ui;
    window.app = app;
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('UI rendering safety', () => {
    it('task title with <img onerror> is not rendered as an element', () => {
        store.addTask({ title: '<img src=x onerror=alert(1)>', time: new Date('2026-11-13T16:00:00+09:00').toISOString() });
        ui.renderTasks();
        const list = document.getElementById('task-list');
        expect(list.querySelector('img')).toBeNull();
        expect(list.textContent).toContain('<img src=x onerror=alert(1)>');
    });

    it('imported javascript: link url is never rendered as a javascript: href', () => {
        store.importData(JSON.stringify({
            links: [{ id: 'evil', title: 'evil', category: 'DEV', url: 'javascript:alert(1)' }],
        }));
        ui.currentLinkCategory = 'ALL';
        ui.renderLinks();
        const anchors = [...document.querySelectorAll('#link-list a[href]')];
        expect(anchors.length).toBeGreaterThan(0);
        for (const a of anchors) {
            expect(a.getAttribute('href').trim().toLowerCase().startsWith('javascript:')).toBe(false);
        }
    });
});

describe('countdown alert', () => {
    it('overdue task triggers alert only once across repeated ticks', () => {
        store.addTask({ title: 'overdue', time: new Date('2026-11-13T13:00:00+09:00').toISOString() });
        const spy = vi.spyOn(ui, 'triggerAlert').mockImplementation(() => {});
        // Simulate main.js ticks: fresh getNextTask() every second.
        for (let i = 0; i < 5; i++) ui.updateCountdown(store.getNextTask());
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('alert-once also holds across a new Store/UI instance (reload)', () => {
        store.addTask({ title: 'overdue', time: new Date('2026-11-13T13:00:00+09:00').toISOString() });
        const spy1 = vi.spyOn(ui, 'triggerAlert').mockImplementation(() => {});
        ui.updateCountdown(store.getNextTask());
        expect(spy1).toHaveBeenCalledTimes(1);

        const store2 = new Store();
        const ui2 = new UI({ store: store2 });
        const spy2 = vi.spyOn(ui2, 'triggerAlert').mockImplementation(() => {});
        ui2.updateCountdown(store2.getNextTask());
        expect(spy2).toHaveBeenCalledTimes(0);
    });
});

describe('i18n', () => {
    it('KR calendar month title shows "2026년 11월"', () => {
        i18n.setLang('KR');
        ui.applyTranslations();
        ui.calYear = 2026;
        ui.calMonth = 10;
        ui.renderCalendar();
        expect(text(document.getElementById('cal-month-title'))).toContain('2026년 11월');
    });
});
