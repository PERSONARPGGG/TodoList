/**
 * Applies static (non-list) translations: labels, buttons, placeholders, weekday header.
 * To translate a new element: give it an id and add [id, dictKey] below.
 */
import { i18n } from '../i18n.js';
import { $, setText } from './dom.js';

/** [elementId, dictKey] pairs. Exported so tests can verify ids and keys exist. */
export const TEXT_BINDINGS = [
    ['system-status', 'sysReady'], ['label-prime-directive', 'primeDirective'],
    ['btn-complete-prime', 'btnComplete'], ['btn-delay-custom', 'btnCustom'],
    ['tab-sub-timeline', 'tabTimeline'], ['tab-sub-calendar', 'tabCalendar'],
    ['chip-all', 'chipAll'], ['chip-pending', 'chipPending'], ['chip-daily', 'chipDaily'], ['chip-cleared', 'chipCleared'],
    ['btn-add', 'btnDetailForm'], ['btn-clear-date-filter', 'calViewAll'],
    ['btn-cal-prev', 'prev'], ['btn-cal-next', 'next'],
    ['label-intel-title', 'intelTitle'], ['label-intel-sub', 'intelSubtitle'],
    ['label-exec-rating', 'execRating'], ['label-eff-index', 'efficiencyIndex'],
    ['label-rate', 'rate'], ['label-delayed', 'delayed'], ['label-done', 'done'],
    ['label-short-term-title', 'shortTermTitle'], ['label-long-term-title', 'longTermTitle'],
    ['btn-edit-short-goal', 'btnEdit'], ['btn-edit-long-goal', 'btnEdit'],
    ['label-backup-title', 'backupTitle'], ['btn-export-json', 'btnExport'], ['btn-import-json-trigger', 'btnRestore'],
    ['label-net-title', 'netTitle'], ['btn-add-link', 'btnAddPortal'],
    ['nav-text-schedule', 'navSchedule'], ['nav-text-intel', 'navIntel'], ['nav-text-network', 'navNetwork'],
    ['modal-add-title', 'modalAddTitle'], ['label-modal-title', 'labelTitle'], ['label-modal-target', 'labelTarget'],
    ['label-modal-daily', 'labelRepeatDaily'], ['label-modal-priority', 'labelPriority'],
    ['btn-cancel', 'btnAbort'], ['btn-save', 'btnEngage'],
    ['modal-delay-title', 'modalRescheduleTitle'], ['modal-delay-sub', 'modalRescheduleSub'],
    ['btn-cancel-custom-delay', 'btnCancel'], ['btn-confirm-custom-delay', 'btnApplyDelay'],
    ['modal-portal-title', 'modalPortalTitle'], ['btn-cancel-link', 'btnCancel'], ['btn-save-link', 'btnStoreLink'],
    ['edit-goal-title', 'modalGoalTitle'], ['btn-cancel-goal', 'btnCancel'], ['btn-save-goal', 'btnUpdate']
];


export function applyStaticTranslations() {
    const lang = i18n.currentLang;
    document.documentElement.lang = { EN: 'en', KR: 'ko', JP: 'ja' }[lang] || 'en';

    document.querySelectorAll('#lang-switcher .lang-btn').forEach(b => {
        const active = b.dataset.lang === lang;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
    });

    TEXT_BINDINGS.forEach(([id, key]) => setText(id, i18n.t(key)));

    const quickInput = $('input-quick-cmd');
    if (quickInput) quickInput.placeholder = i18n.t('quickPlaceholder');

    // Calendar weekday header (Sunday-first). 2026-11-01 is a Sunday.
    const weekdays = $('cal-weekdays');
    if (weekdays) {
        const fmt = new Intl.DateTimeFormat(i18n.locale(), { weekday: 'short' });
        weekdays.querySelectorAll('span').forEach((span, i) => {
            span.textContent = fmt.format(new Date(2026, 10, 1 + i)).toUpperCase();
        });
    }
}
