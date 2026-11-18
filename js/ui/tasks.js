/**
 * Schedule timeline: quick-command bar, filter chips, task list, detailed-add modal.
 */
import { i18n } from '../i18n.js';
import { escapeHTML, isSameDay } from '../utils.js';
import { $, delegate } from './dom.js';
import { playSlashEffect } from './effects.js';

const CHIP_OFF = 'px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-gray-900 text-gray-400 hover:text-white task-chip';
const CHIP_ON = 'px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-red-600 text-white task-chip active';

const FILTERS = {
    ALL: () => true,
    PENDING: t => !t.completed,
    DAILY: t => t.isDaily,
    CLEARED: t => t.completed
};

export function relativeLabel(diffMs) {
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    if (hours >= 24) return { cls: 'text-gray-400', text: i18n.fn('inDays', Math.floor(hours / 24)) };
    if (hours > 0) return { cls: 'text-yellow-300', text: i18n.fn('inHoursMins', hours, mins) };
    return { cls: 'text-red-400 animate-pulse', text: i18n.fn('inMins', mins) };
}

export class TaskListView {
    /** @param {import('../ui.js').UI} ui */
    constructor(ui) {
        this.ui = ui;
        this.editingTaskId = null;
        this.pendingQuickInput = null;
    }

    get store() {
        return this.ui.store;
    }

    bind() {
        const quickInput = $('input-quick-cmd');
        $('form-quick-cmd')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = quickInput.value.trim();
            if (!text) return;
            const parsed = this.store.parseQuickInput(text);
            if (parsed.needsClarification) {
                this.pendingQuickInput = text;
                $('quick-clarification-message').textContent = i18n.t('quickClarificationMessage');
                $('input-quick-clarification').value = '';
                this.ui.modals.open($('quick-clarification-modal'), $('input-quick-clarification'));
                return;
            }
            this.addParsedTask(parsed);
            quickInput.value = '';
        });

        $('btn-cancel-quick-clarification')?.addEventListener('click', () => {
            this.pendingQuickInput = null;
            this.ui.modals.close($('quick-clarification-modal'));
        });
        $('btn-confirm-quick-clarification')?.addEventListener('click', () => {
            const detail = $('input-quick-clarification').value.trim();
            if (!this.pendingQuickInput || !detail) return;
            const original = this.store.parseQuickInput(this.pendingQuickInput);
            const parsed = this.store.parseQuickInput(`${detail} ${original.title}`);
            if (parsed.needsClarification) {
                $('quick-clarification-message').textContent = i18n.t('quickClarificationMessage');
                return;
            }
            this.addParsedTask(parsed);
            $('input-quick-cmd').value = '';
            this.pendingQuickInput = null;
            this.ui.modals.close($('quick-clarification-modal'));
        });

        document.querySelectorAll('#task-filter-chips .task-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('#task-filter-chips .task-chip').forEach(c => { c.className = CHIP_OFF; });
                chip.className = CHIP_ON;
                this.ui.state.taskFilter = chip.dataset.filter;
                this.render();
            });
        });

        const list = $('task-list');
        delegate(list, '[data-action="open-task"]', (btn) => this.openDetail(btn.dataset.id));
        delegate(list, '[data-action="toggle-complete"]', (btn) => this.toggleComplete(btn.dataset.id));
        delegate(list, '[data-action="delete-task"]', (btn) => {
            const task = this.store.getTasks().find(t => t.id === btn.dataset.id);
            if (task && window.confirm(i18n.fn('confirmDelete', task.title))) {
                this.store.deleteTask(task.id);
                this.ui.refresh();
            }
        });

        const openClearCompleted = () => {
            if (this.store.getTasks().some(task => task.completed)) {
                this.ui.modals.open($('clear-completed-modal'), $('btn-cancel-clear-completed'));
            }
        };
        $('btn-clear-completed')?.addEventListener('click', openClearCompleted);
        $('btn-clear-calendar-completed')?.addEventListener('click', openClearCompleted);
        $('btn-cancel-clear-completed')?.addEventListener('click', () => this.ui.modals.close($('clear-completed-modal')));
        $('btn-confirm-clear-completed')?.addEventListener('click', () => {
            const removed = this.store.clearCompletedTasks();
            this.ui.modals.close($('clear-completed-modal'));
            if (removed > 0) playSlashEffect(i18n.t('fxCleared'));
            this.ui.refresh();
        });

        this.bindDetailModal();
    }

    addParsedTask(parsed) {
        this.store.addTask({
            title: parsed.title,
            time: parsed.time,
            isDaily: parsed.isDaily,
            type: parsed.isDaily ? 'critical' : 'normal'
        });
        playSlashEffect(i18n.t('fxEngaged'));
        this.ui.refresh();
    }

    bindDetailModal() {
        const modal = $('add-modal');
        $('btn-add')?.addEventListener('click', () => {
            this.editingTaskId = null;
            const tzoffset = new Date().getTimezoneOffset() * 60000;
            $('input-time').value = new Date(Date.now() - tzoffset + 3600000).toISOString().slice(0, 16);
            $('input-task').value = '';
            $('input-is-daily').checked = false;
            this.ui.modals.open(modal, $('input-task'));
        });
        $('btn-cancel')?.addEventListener('click', () => this.ui.modals.close(modal));
        $('btn-save')?.addEventListener('click', () => {
            const title = $('input-task').value.trim();
            const time = $('input-time').value;
            if (!title || !time) return;
            const patch = {
                title,
                time: new Date(time).toISOString(),
                type: $('input-priority').value,
                isDaily: $('input-is-daily').checked
            };
            if (this.editingTaskId) this.store.updateTask(this.editingTaskId, patch);
            else this.store.addTask(patch);
            this.editingTaskId = null;
            this.ui.refresh();
            this.ui.modals.close(modal);
        });
    }

    openDetail(id) {
        const task = this.store.getTasks().find(t => t.id === id);
        if (!task) return;
        this.editingTaskId = id;
        const tzoffset = new Date().getTimezoneOffset() * 60000;
        $('input-task').value = task.title;
        $('input-time').value = new Date(new Date(task.time).getTime() - tzoffset).toISOString().slice(0, 16);
        $('input-is-daily').checked = !!task.isDaily;
        $('input-priority').value = task.type;
        this.ui.modals.open($('add-modal'), $('input-task'));
    }

    toggleComplete(id) {
        const task = this.store.getTasks().find(t => t.id === id);
        if (!task) return;
        if (task.completed) {
            this.store.uncompleteTask(id);
        } else {
            this.store.completeTask(id);
            playSlashEffect(i18n.t('fxCleared'));
        }
        this.ui.refresh();
    }

    render() {
        const list = $('task-list');
        if (!list) return;

        const { selectedDate, taskFilter } = this.ui.state;
        const allTasks = this.store.getTasks();
        const hasCompleted = allTasks.some(task => task.completed);
        $('btn-clear-completed')?.classList.toggle('hidden', !hasCompleted);
        $('btn-clear-calendar-completed')?.classList.toggle('hidden', !hasCompleted);
        const tasks = allTasks
            .filter(t => !selectedDate || isSameDay(new Date(t.time), selectedDate))
            .filter(FILTERS[taskFilter] || FILTERS.ALL);

        if (tasks.length === 0) {
            list.innerHTML = `
                <li class="p-6 text-center border border-dashed border-gray-900 rounded-lg">
                    <p class="font-bebas text-xl text-gray-700 tracking-wider">${escapeHTML(i18n.t('noDirectives'))}</p>
                    <p class="text-xs text-gray-600 mt-1 font-mono">${escapeHTML(i18n.t('noDirectivesSub'))}</p>
                </li>
            `;
            return;
        }

        const now = new Date();
        const fmt = new Intl.DateTimeFormat(i18n.locale(), {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
        });
        list.innerHTML = tasks.map(task => this.itemHTML(task, now, fmt)).join('');
    }

    itemHTML(task, now, fmt) {
        const taskDate = new Date(task.time);
        const diffMs = taskDate - now;
        const id = escapeHTML(task.id);
        const deleteLabel = escapeHTML(i18n.t('deleteTitle'));

        let relativeBadge;
        if (task.completed) {
            relativeBadge = `<span class="text-[9px] font-mono text-emerald-400 font-bold">${escapeHTML(i18n.t('tagCleared'))}</span>`;
        } else if (diffMs < 0) {
            relativeBadge = `<span class="text-[9px] font-mono text-red-500 font-bold animate-pulse">${escapeHTML(i18n.t('tagOverdue'))}</span>`;
        } else {
            const rel = relativeLabel(diffMs);
            relativeBadge = `<span class="text-[9px] font-mono ${rel.cls} font-bold">${escapeHTML(rel.text)}</span>`;
        }

        return `
            <li class="task-card-persona p-3 flex items-center justify-between gap-3 ${task.completed ? 'task-completed' : ''}">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <button data-action="toggle-complete" data-id="${id}" aria-pressed="${task.completed}" aria-label="${escapeHTML(task.title)}" class="w-5 h-5 rounded border ${task.completed ? 'bg-emerald-600 border-emerald-500 text-black font-black' : 'border-gray-700 hover:border-red-500'} flex items-center justify-center shrink-0 transition-colors">
                        ${task.completed ? '✓' : ''}
                    </button>

                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <button type="button" data-action="open-task" data-id="${id}" class="text-[10px] font-mono text-gray-400 hover:text-white font-bold uppercase tracking-wider text-left" aria-label="${escapeHTML(`${task.title} ${fmt.format(taskDate)}`)}">${escapeHTML(fmt.format(taskDate))}</button>
                            ${relativeBadge}
                            ${task.isDaily ? `<span class="text-[9px] font-mono bg-yellow-950/80 border border-yellow-700 text-yellow-300 px-1.5 rounded font-black">${escapeHTML(i18n.t('tagDaily'))}</span>` : ''}
                            ${task.delayCount > 0 ? `<span class="text-[9px] font-mono bg-red-950/80 border border-red-800 text-red-300 px-1 rounded">+${Number(task.delayCount)}D</span>` : ''}
                            ${task.type === 'critical' ? `<span class="text-[9px] font-mono text-red-400 font-bold">${escapeHTML(i18n.t('tagCritical'))}</span>` : ''}
                        </div>
                        <button type="button" data-action="open-task" data-id="${id}" class="task-title font-bold text-white text-sm truncate tracking-tight text-left w-full" title="${escapeHTML(task.title)}">${escapeHTML(task.title)}</button>
                    </div>
                </div>

                <button data-action="delete-task" data-id="${id}" class="text-gray-600 hover:text-red-500 p-1.5 transition-colors shrink-0" title="${deleteLabel}" aria-label="${deleteLabel}">
                    <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </li>
        `;
    }
}
