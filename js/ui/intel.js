/**
 * Intel tab: productivity stats, short/long-term goals editor, JSON backup export/restore.
 */
import { i18n } from '../i18n.js';
import { $, setText } from './dom.js';
import { playSlashEffect } from './effects.js';

export class IntelView {
    /** @param {import('../ui.js').UI} ui */
    constructor(ui) {
        this.ui = ui;
        this.editingGoal = null; // 'short' | 'long'
    }

    get store() {
        return this.ui.store;
    }

    bind() {
        this.bindGoals();
        this.bindBackup();
    }

    bindGoals() {
        const modal = $('edit-goal-modal');
        const input = $('input-goal-text');
        const open = (type) => {
            this.editingGoal = type;
            setText('edit-goal-title', i18n.t(type === 'short' ? 'shortTermTitle' : 'longTermTitle'));
            const goals = this.store.getGoals();
            input.value = type === 'short' ? goals.shortTerm : goals.longTerm;
            this.ui.modals.open(modal, input);
        };
        $('btn-edit-short-goal')?.addEventListener('click', () => open('short'));
        $('btn-edit-long-goal')?.addEventListener('click', () => open('long'));
        $('btn-cancel-goal')?.addEventListener('click', () => this.ui.modals.close(modal));
        $('btn-save-goal')?.addEventListener('click', () => {
            // Empty is allowed so a goal can be cleared.
            const val = input.value.trim();
            const current = this.store.getGoals();
            if (this.editingGoal === 'short') this.store.saveGoals(val, current.longTerm);
            else this.store.saveGoals(current.shortTerm, val);
            this.renderGoals();
            this.ui.modals.close(modal);
        });
    }

    bindBackup() {
        $('btn-export-json')?.addEventListener('click', () => {
            const blob = new Blob([this.store.exportAllData()], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chronos_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            // Revoking synchronously can cancel the download in Safari/Firefox.
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });

        const fileInput = $('file-import-json');
        $('btn-import-json-trigger')?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                if (!this.store.importData(event.target.result)) {
                    this.ui.showAlert(i18n.t('importInvalid'));
                    return;
                }
                this.ui.alerts.reset();
                playSlashEffect(i18n.t('fxRestored'));
                this.ui.renderAll();
            };
            reader.readAsText(file);
            fileInput.value = ''; // allow re-selecting the same file later
        });
    }

    renderStats() {
        const stats = this.store.getStats();
        setText('stat-rate', `${stats.completionRate}%`);
        setText('stat-delayed', String(stats.totalDelays));
        setText('stat-completed', String(stats.completed));

        const rank = $('rank-stamp-badge');
        if (rank) {
            rank.className = `rank-stamp rank-${stats.grade.toLowerCase()}`;
            rank.textContent = `RANK ${stats.grade}`;
        }
    }

    renderGoals() {
        const goals = this.store.getGoals();
        setText('display-short-goal', goals.shortTerm || i18n.t('targetNone'));
        setText('display-long-goal', goals.longTerm || i18n.t('targetNone'));
    }
}
