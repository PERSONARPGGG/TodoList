/**
 * UI — coordinator for the Chronos Tactical Persona interface.
 *
 * Each screen area is its own module under js/ui/ and only touches its own DOM:
 *   ui/tasks.js          timeline, quick command, filter chips, detailed-add modal
 *   ui/countdown.js      prime directive hero, gauge, complete/delay actions
 *   ui/calendar.js       mini calendar + date filter
 *   ui/intel.js          stats, goals, backup
 *   ui/links.js          network portals
 *   ui/navigation.js     bookmark tabs + swipe
 *   ui/modals.js         open/close/Escape/backdrop
 *   ui/effects.js        slash overlays
 *   ui/notifications.js  delivery + permission badge
 *   ui/translate.js      static label translations
 * Cross-view state lives in `this.state`; views re-render each other only through this class.
 */
import { i18n } from './i18n.js';
import { AlertScheduler } from './core/alerts.js';
import { ModalManager } from './ui/modals.js';
import { Navigation } from './ui/navigation.js';
import { TaskListView } from './ui/tasks.js';
import { CountdownView } from './ui/countdown.js';
import { CalendarView } from './ui/calendar.js';
import { IntelView } from './ui/intel.js';
import { LinksView } from './ui/links.js';
import { SettingsView } from './ui/settings.js';
import { applyStaticTranslations } from './ui/translate.js';
import { playIntroAnimation, playSlashEffect } from './ui/effects.js';
import { deliverAlert, deliverBriefing, renderPushBadge, requestPermission, stopDueAlert } from './ui/notifications.js';
import { DailyBriefingScheduler } from './core/briefing.js';
import { $, activateOnKey } from './ui/dom.js';

export class UI {
    /** @param {{ store: import('./store.js').Store }} app */
    constructor(app) {
        this.app = app;

        const now = new Date();
        /** Shared view state — the only data views read from each other. */
        this.state = {
            taskFilter: 'ALL',          // ALL | PENDING | DAILY | CLEARED
            selectedDate: null,         // Date | null (calendar day filter)
            linkCategory: 'ALL',
            calYear: now.getFullYear(),
            calMonth: now.getMonth()
        };

        this.modals = new ModalManager();
        this.alerts = new AlertScheduler(this.store, (title, minutesLeft) => this.triggerAlert(title, minutesLeft));
        this.views = {
            tasks: new TaskListView(this),
            countdown: new CountdownView(this),
            calendar: new CalendarView(this),
            intel: new IntelView(this),
            links: new LinksView(this),
            settings: new SettingsView(this)
        };
        this.briefing = new DailyBriefingScheduler(this.store, briefing => deliverBriefing(briefing));
        this.nav = new Navigation({
            onShow: (viewId) => this.onTabShown(viewId),
            isBlocked: () => !!this.modals.current()
        });

        this.modals.bind();
        this.nav.bind();
        Object.values(this.views).forEach(v => v.bind());
        this.bindGlobalControls();
        this.applyTranslations();
    }

    get store() {
        return this.app.store;
    }

    bindGlobalControls() {
        document.querySelectorAll('#lang-switcher .lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                i18n.setLang(btn.dataset.lang);
                this.applyTranslations();
                this.renderAll();
            });
        });

        const hourglass = $('cyber-hourglass');
        hourglass?.addEventListener('click', () => {
            hourglass.classList.toggle('flip');
            playSlashEffect(i18n.t('fxFlip'));
        });
        activateOnKey(hourglass, () => hourglass.click());

        $('btn-request-notify')?.addEventListener('click', () => requestPermission((message) => this.showAlert(message)));
        $('btn-close-system-alert')?.addEventListener('click', () => {
            stopDueAlert();
            this.modals.close($('system-alert-modal'));
        });
    }

    onTabShown(viewId) {
        if (viewId === 'view-info') {
            this.renderStats();
            this.renderGoals();
        } else if (viewId === 'view-urls') {
            this.renderLinks();
        } else if (viewId === 'view-settings') {
            this.renderSettings();
        }
    }

    /* ---------- Rendering entry points ---------- */
    /** Everything derived from tasks, plus an immediate countdown tick. */
    refresh() {
        this.renderTasks();
        this.renderStats();
        this.renderCalendar();
        this.updateCountdown(this.store.getNextTask());
    }

    renderAll() {
        this.refresh();
        this.renderGoals();
        this.renderLinks();
        this.renderSettings();
    }

    applyTranslations() {
        applyStaticTranslations();
        renderPushBadge();
    }

    renderTasks() { this.views.tasks.render(); }
    renderCalendar() { this.views.calendar.render(); }
    renderStats() { this.views.intel.renderStats(); }
    renderGoals() { this.views.intel.renderGoals(); }
    renderLinks() { this.views.links.render(); }
    renderSettings() { this.views.settings.render(); }

    /** One clock tick: redraw the hero, then run alert checks for every pending task. */
    updateCountdown(nextTask, now = new Date()) {
        this.views.countdown.render(nextTask, now);
        this.alerts.check(now);
        this.briefing.check(now);
    }

    /* ---------- Delegates kept as the public API (main.js / tests) ---------- */
    openModal(modal, focusEl) { this.modals.open(modal, focusEl); }
    closeModal(modal) { this.modals.close(modal); }
    switchTabByIndex(index, direction) { this.nav.switchTo(index, direction); }
    filterDate(year, month, day) { this.views.calendar.toggleDate(new Date(year, month, day)); }
    toggleTaskComplete(id) { this.views.tasks.toggleComplete(id); }
    openTaskDetail(id) { this.views.tasks.openDetail(id); }
    playIntroAnimation() { playIntroAnimation(); }
    playSlashEffect(message) { playSlashEffect(message); }
    initNotificationState() { renderPushBadge(); }
    requestNotificationPermission() { requestPermission((message) => this.showAlert(message)); }
    showAlert(message, title = null, isDueAlert = false) {
        const modal = $('system-alert-modal');
        if (!modal) return;
        $('system-alert-title').textContent = title || i18n.t('systemAlertTitle');
        $('system-alert-message').textContent = message;
        $('btn-close-system-alert').textContent = i18n.t(isDueAlert ? 'alertStop' : 'btnAcknowledge');
        this.modals.open(modal, $('btn-close-system-alert'));
    }
    triggerAlert(title, minutesLeft = null) {
        deliverAlert(title, minutesLeft);
        const isMobile = window.matchMedia?.('(max-width: 767px)').matches ?? window.innerWidth <= 767;
        if (minutesLeft === null && isMobile) {
            this.showAlert(i18n.fn('alertBody', title), i18n.t('alertTitle'), true);
        }
    }

    // Pre-0.5.2 field names, mapped onto shared state.
    get calYear() { return this.state.calYear; }
    set calYear(v) { this.state.calYear = v; }
    get calMonth() { return this.state.calMonth; }
    set calMonth(v) { this.state.calMonth = v; }
    get selectedDateFilter() { return this.state.selectedDate; }
    set selectedDateFilter(v) { this.state.selectedDate = v; }
    get currentTaskFilter() { return this.state.taskFilter; }
    set currentTaskFilter(v) { this.state.taskFilter = v; }
    get currentLinkCategory() { return this.state.linkCategory; }
    set currentLinkCategory(v) { this.state.linkCategory = v; }
}
