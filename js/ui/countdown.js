/**
 * Prime-directive hero: countdown timer, resource gauge, live clock, complete/delay actions.
 * Rendering only — alert scheduling lives in core/alerts.js.
 */
import { i18n } from '../i18n.js';
import { $ } from './dom.js';
import { playSlashEffect } from './effects.js';

const BADGE_BASE = 'text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-black';
const TIMER_BASE = 'font-bebas fluid-timer-text tracking-wider leading-none';
const GAUGE_WINDOW_MS = 24 * 3600 * 1000;
const URGENT_MS = 10 * 60 * 1000;
const MAX_CUSTOM_DELAY_MIN = 60 * 24 * 30;

export class CountdownView {
    /** @param {import('../ui.js').UI} ui */
    constructor(ui) {
        this.ui = ui;
    }

    get store() {
        return this.ui.store;
    }

    bind() {
        $('btn-complete-prime')?.addEventListener('click', () => {
            const next = this.store.getNextTask();
            if (!next) return;
            this.store.completeTask(next.id);
            playSlashEffect(i18n.t('fxMission'));
            this.ui.refresh();
        });

        $('btn-delay-15m')?.addEventListener('click', () => this.delayPrime(15));
        $('btn-delay-1h')?.addEventListener('click', () => this.delayPrime(60));
        $('btn-delay-1d')?.addEventListener('click', () => this.delayPrime(1440));

        const customModal = $('delay-custom-modal');
        $('btn-delay-custom')?.addEventListener('click', () => this.ui.modals.open(customModal, $('input-custom-minutes')));
        $('btn-cancel-custom-delay')?.addEventListener('click', () => this.ui.modals.close(customModal));
        $('btn-confirm-custom-delay')?.addEventListener('click', () => {
            const mins = parseInt($('input-custom-minutes').value, 10);
            if (mins > 0 && mins <= MAX_CUSTOM_DELAY_MIN && this.delayPrime(mins)) this.ui.modals.close(customModal);
        });
    }

    delayPrime(minutes) {
        const next = this.store.getNextTask();
        if (!next) return false;
        this.store.delayTask(next.id, minutes);
        this.ui.refresh();
        return true;
    }

    render(nextTask, now = new Date()) {
        const titleEl = $('next-task-title');
        const timerEl = $('countdown-timer');
        if (!titleEl || !timerEl) return;

        const targetStamp = $('target-timestamp');
        const badge = $('task-badge-time-left');
        const gaugeFill = $('time-gauge-fill');
        const gaugePercent = $('gauge-percent');
        const hourglass = $('cyber-hourglass');
        const liveClock = $('live-clock');
        if (liveClock) liveClock.textContent = now.toTimeString().slice(0, 8);

        const setBadge = (cls, text) => {
            if (!badge) return;
            badge.className = `${BADGE_BASE} ${cls}`;
            badge.textContent = text;
        };
        const setGauge = (pct, label) => {
            if (gaugeFill) gaugeFill.style.width = `${pct}%`;
            if (gaugePercent) gaugePercent.textContent = label;
        };

        if (!nextTask) {
            titleEl.textContent = i18n.t('noDirectives');
            timerEl.textContent = '00:00:00';
            timerEl.className = `${TIMER_BASE} text-gray-700`;
            if (targetStamp) targetStamp.textContent = i18n.t('targetNone');
            hourglass?.classList.remove('hourglass-urgent');
            setBadge('bg-gray-900 border border-gray-800 text-gray-500', i18n.t('standby'));
            setGauge(0, `${i18n.t('resources')}: 0%`);
            $('delay-actions')?.classList.add('hidden');
            return;
        }

        const target = new Date(nextTask.time);
        $('delay-actions')?.classList.remove('hidden');
        titleEl.textContent = nextTask.title;
        if (targetStamp) {
            const hhmm = target.toLocaleTimeString(i18n.locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
            targetStamp.textContent = `${i18n.t('target')}: ${hhmm}`;
        }

        const diffMs = target - now;
        if (diffMs <= 0) {
            timerEl.textContent = '00:00:00';
            timerEl.className = `${TIMER_BASE} text-red-500 glow-red animate-pulse`;
            hourglass?.classList.add('hourglass-urgent');
            setBadge('bg-red-950/90 border border-red-700 text-red-300 animate-pulse', i18n.t('tagOverdue'));
            setGauge(100, i18n.t('expired'));
            return;
        }

        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        const pad = (n) => n.toString().padStart(2, '0');
        timerEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

        setBadge('bg-yellow-950/80 border border-yellow-700 text-yellow-300', i18n.fn('inHoursMins', hours, minutes));

        const pct = Math.min(100, Math.max(5, Math.round((diffMs / GAUGE_WINDOW_MS) * 100)));
        setGauge(pct, `${i18n.t('resources')}: ${pct}% ${i18n.t('remaining')}`);

        const urgent = diffMs < URGENT_MS;
        timerEl.className = urgent
            ? `${TIMER_BASE} text-red-500 glow-red animate-timer-beat`
            : `${TIMER_BASE} text-yellow-400 glow-yellow animate-timer-beat`;
        hourglass?.classList.toggle('hourglass-urgent', urgent);
    }
}
