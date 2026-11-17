/**
 * Modal manager: open/close with fade, backdrop click, Escape, Enter-to-submit, focus return.
 */
import { $ } from './dom.js';

export const MODAL_IDS = ['add-modal', 'delay-custom-modal', 'add-link-modal', 'edit-goal-modal', 'system-alert-modal', 'clear-completed-modal'];

/** Which button Enter in a single-line input should press, per modal. */
const SUBMIT_BUTTON = {
    'add-modal': 'btn-save',
    'delay-custom-modal': 'btn-confirm-custom-delay',
    'add-link-modal': 'btn-save-link'
};

export class ModalManager {
    constructor() {
        this.lastFocus = null;
    }

    bind() {
        MODAL_IDS.forEach(id => {
            const modal = $(id);
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) this.close(modal);
            });
            modal?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !e.isComposing && SUBMIT_BUTTON[id]) {
                    e.preventDefault();
                    $(SUBMIT_BUTTON[id])?.click();
                }
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close(this.current());
        });
    }

    open(modal, focusEl) {
        if (!modal) return;
        // Cancel a pending close so a quick close→reopen isn't hidden by the stale timer.
        clearTimeout(modal._chronosTimer);
        this.lastFocus = document.activeElement;
        modal.classList.remove('hidden');
        modal._chronosTimer = setTimeout(() => modal.classList.remove('opacity-0'), 10);
        focusEl?.focus();
    }

    close(modal) {
        if (!modal || modal.classList.contains('hidden')) return;
        clearTimeout(modal._chronosTimer);
        modal.classList.add('opacity-0');
        modal._chronosTimer = setTimeout(() => modal.classList.add('hidden'), 150);
        this.lastFocus?.focus?.();
    }

    /** The modal currently on screen, if any. */
    current() {
        return MODAL_IDS.map(id => $(id)).find(m => m && !m.classList.contains('hidden'));
    }
}
