/**
 * Entry point: wires Store (data) + UI (view), runs the 1s clock, registers the service worker.
 * Nothing is attached to `window` — modules talk through imports only.
 */
import { STORAGE_KEYS } from './config.js';
import { has, writeString } from './data/storage.js';
import { Store } from './store.js';
import { UI } from './ui.js';

export class ChronosApp {
    constructor() {
        this.store = new Store();
        this.ui = new UI(this);
        this.timerInterval = null;
        this.onVisibilityChange = () => {
            if (document.visibilityState === 'visible') this.ui.refresh();
        };
    }

    start() {
        this.seedOnce();
        this.ui.playIntroAnimation();
        this.ui.renderAll();
        this.startTimer();

        // Timers are throttled in background tabs; resync immediately when the user returns.
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        return this;
    }

    /** Sample data only on the very first boot — not every time the list becomes empty. */
    seedOnce() {
        if (has(STORAGE_KEYS.seeded)) return;
        writeString(STORAGE_KEYS.seeded, '1');
        if (this.store.getTasks().length > 0) return;

        const soon = new Date();
        soon.setHours(soon.getHours() + 2);
        this.store.addTask({ title: 'Review Tactical Architecture & PWA Cache', time: soon.toISOString(), type: 'critical' });

        const later = new Date();
        later.setHours(later.getHours() + 6);
        this.store.addTask({ title: 'Verify ENTJ Productivity Protocol', time: later.toISOString(), type: 'normal' });
    }

    tick() {
        this.ui.updateCountdown(this.store.getNextTask());
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.tick();
        this.timerInterval = setInterval(() => this.tick(), 1000);
    }

    stop() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
}

// Auto-boot in the browser; tests import ChronosApp and boot it themselves.
if (typeof document !== 'undefined' && !globalThis.__CHRONOS_NO_AUTOBOOT__) {
    document.addEventListener('DOMContentLoaded', () => new ChronosApp().start());

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW registration failed', err));
        });
    }
}
