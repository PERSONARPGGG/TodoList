/**
 * Mini calendar: Timeline/Calendar sub-tabs, month navigation, day filter for the timeline.
 */
import { i18n } from '../i18n.js';
import { isSameDay } from '../utils.js';
import { $, delegate, activateOnKey } from './dom.js';

const SUB_ON = (color) => `text-xs uppercase font-bold tracking-wider text-${color} pb-0.5 border-b-2 border-${color} transition-colors`;
const SUB_OFF = 'text-xs uppercase font-bold tracking-wider text-gray-500 hover:text-white pb-0.5 border-b-2 border-transparent transition-colors';

export class CalendarView {
    /** @param {import('../ui.js').UI} ui */
    constructor(ui) {
        this.ui = ui;
    }

    get state() {
        return this.ui.state;
    }

    bind() {
        const btnTimeline = $('tab-sub-timeline');
        const btnCalendar = $('tab-sub-calendar');
        const widget = $('calendar-widget');

        btnTimeline?.addEventListener('click', () => {
            btnTimeline.className = SUB_ON('red-500');
            btnCalendar.className = SUB_OFF;
            widget.classList.add('hidden');
        });
        btnCalendar?.addEventListener('click', () => {
            btnCalendar.className = SUB_ON('yellow-400');
            btnTimeline.className = SUB_OFF;
            widget.classList.remove('hidden');
            this.render();
        });

        $('btn-cal-prev')?.addEventListener('click', () => this.shiftMonth(-1));
        $('btn-cal-next')?.addEventListener('click', () => this.shiftMonth(1));

        const grid = $('cal-grid-days');
        const pick = (cell) => this.toggleDate(new Date(this.state.calYear, this.state.calMonth, parseInt(cell.dataset.calDay, 10)));
        delegate(grid, '[data-cal-day]', pick);
        activateOnKey(grid, (e) => {
            const cell = e.target.closest('[data-cal-day]');
            if (cell) pick(cell);
        });

        $('btn-clear-date-filter')?.addEventListener('click', () => {
            this.state.selectedDate = null;
            this.render();
            this.ui.renderTasks();
        });
    }

    shiftMonth(delta) {
        const d = new Date(this.state.calYear, this.state.calMonth + delta, 1);
        this.state.calYear = d.getFullYear();
        this.state.calMonth = d.getMonth();
        this.render();
    }

    /** Select a day (or clear it if already selected) and re-filter the timeline. */
    toggleDate(date) {
        const sel = this.state.selectedDate;
        this.state.selectedDate = sel && isSameDay(sel, date) ? null : date;
        this.render();
        this.ui.renderTasks();
    }

    render() {
        const grid = $('cal-grid-days');
        const monthTitle = $('cal-month-title');
        if (!grid || !monthTitle) return;

        const { calYear: year, calMonth: month, selectedDate } = this.state;
        const title = new Intl.DateTimeFormat(i18n.locale(), { year: 'numeric', month: 'long' }).format(new Date(year, month, 1));
        monthTitle.textContent = i18n.currentLang === 'EN' ? title.toUpperCase() : title;

        // Bucket tasks by day once instead of filtering the whole list for every cell.
        const byDay = new Map();
        this.ui.store.getTasks().forEach(t => {
            const td = new Date(t.time);
            if (td.getFullYear() !== year || td.getMonth() !== month) return;
            if (!byDay.has(td.getDate())) byDay.set(td.getDate(), []);
            byDay.get(td.getDate()).push(t);
        });

        const now = new Date();
        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let html = '<div class="cal-cell opacity-20 pointer-events-none"></div>'.repeat(firstDayIndex);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayTasks = byDay.get(day) || [];
            const isSelected = !!selectedDate && isSameDay(selectedDate, date);
            const classes = ['cal-cell', isSameDay(date, now) && 'today', dayTasks.length && 'has-task', isSelected && 'selected']
                .filter(Boolean).join(' ');

            html += `
                <div role="button" tabindex="0" data-cal-day="${day}" aria-pressed="${isSelected}" class="${classes}">
                    <span class="font-bold">${day}</span>
                    ${dayTasks.length ? `
                        <div class="cal-dot-container">
                            <div class="cal-dot ${dayTasks.some(t => t.type === 'critical') ? 'dot-critical' : ''}"></div>
                            ${dayTasks.length > 1 ? `<span class="text-[8px] font-mono text-gray-400 leading-none">${dayTasks.length}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        grid.innerHTML = html;

        const banner = $('cal-filter-banner');
        const filterText = $('cal-filter-text');
        if (selectedDate) {
            banner?.classList.remove('hidden');
            if (filterText) {
                const d = selectedDate.toLocaleDateString(i18n.locale(), { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
                filterText.textContent = `${i18n.t('calFiltered')}: ${d.toUpperCase()}`;
            }
        } else {
            banner?.classList.add('hidden');
        }
    }
}
