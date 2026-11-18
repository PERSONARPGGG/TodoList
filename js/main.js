/**
 * Entry point: wires Store (data) + UI (view), runs the 1s clock, registers the service worker.
 * Nothing is attached to `window` — modules talk through imports only.
 */
import { STORAGE_KEYS } from './config.js';
import '../style.css';
import { has, writeString } from './data/storage.js';
import { Store } from './store.js';
import { UI } from './ui.js';
import { i18n } from './i18n.js';

export class ChronosApp {
    constructor() {
        this.store = new Store();
        this.ui = new UI(this);
        this.timerInterval = null;
        this.deferredInstallPrompt = null;
        this.setupInstallPrompt();
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

    setupInstallPrompt() {
        const button = document.getElementById('btn-install-app');
        if (!button) return;
        const isMobile = () => window.matchMedia?.('(max-width: 767px)').matches ?? false;
        const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
        const sync = () => {
            button.classList.toggle('hidden', !isMobile() || isStandalone());
            button.classList.toggle('flex', isMobile() && !isStandalone());
        };
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.deferredInstallPrompt = event;
            sync();
        });
        button.addEventListener('click', async () => {
            if (!this.deferredInstallPrompt) {
                this.ui.showAlert(i18n.t('installHelp'));
                return;
            }
            this.deferredInstallPrompt.prompt();
            await this.deferredInstallPrompt.userChoice;
            this.deferredInstallPrompt = null;
            sync();
        });
        window.addEventListener('resize', sync);
        sync();
    }

    /** Sample data only on the very first boot — not every time the list becomes empty. */
    seedOnce() {
        // Demo tasks are useful during local development, but must never appear in production.
        if (!import.meta.env?.DEV) return;
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
            if (import.meta.env?.DEV) {
                // A production SW can serve a stale index/Vite client during local development.
                navigator.serviceWorker.getRegistrations()
                    .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
                    .catch(() => {});
                return;
            }
            navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW registration failed', err));
        });
    }
}
