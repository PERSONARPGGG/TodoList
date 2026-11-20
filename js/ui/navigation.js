/**
 * Main tab navigation: right bookmark buttons, swipe dots, and horizontal swipe gestures.
 */
import { $ } from './dom.js';

export const TABS = ['view-schedule', 'view-info', 'view-settings'];
/** Touches starting here never switch tabs (chip rows scroll sideways, inputs select text). */
const SWIPE_IGNORE = 'input, textarea, select, .overflow-x-auto, #calendar-widget';

export class Navigation {
    /**
     * @param {object} opts
     * @param {(viewId: string) => void} opts.onShow  called after a tab becomes visible
     * @param {() => boolean} opts.isBlocked          true while a modal is open
     */
    constructor({ onShow, isBlocked }) {
        this.onShow = onShow;
        this.isBlocked = isBlocked;
        this.index = 0;
        this.touch = { x: 0, y: 0, ignored: false };
    }

    bind() {
        document.querySelectorAll('.nav-btn, .swipe-dot').forEach(btn => {
            btn.addEventListener('click', () => this.switchTo(parseInt(btn.dataset.index, 10)));
        });

        const area = $('main-content');
        area?.addEventListener('touchstart', (e) => {
            this.touch.x = e.touches[0].clientX;
            this.touch.y = e.touches[0].clientY;
            this.touch.ignored = !!e.target.closest?.(SWIPE_IGNORE) || this.isBlocked();
        }, { passive: true });

        area?.addEventListener('touchend', (e) => {
            if (this.touch.ignored) return;
            const dx = e.changedTouches[0].clientX - this.touch.x;
            const dy = e.changedTouches[0].clientY - this.touch.y;
            if (Math.abs(dx) <= 50 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
            if (dx < 0 && this.index < TABS.length - 1) this.switchTo(this.index + 1, 'left');
            else if (dx > 0 && this.index > 0) this.switchTo(this.index - 1, 'right');
        }, { passive: true });
    }

    switchTo(index, direction = 'right') {
        if (!Number.isInteger(index) || index < 0 || index >= TABS.length) return;
        this.index = index;
        const viewId = TABS[index];

        document.querySelectorAll('.nav-btn').forEach(b => {
            const active = parseInt(b.dataset.index, 10) === index;
            b.classList.toggle('active', active);
            b.setAttribute('aria-current', active ? 'page' : 'false');
            const indicator = b.querySelector('.indicator');
            if (indicator) {
                indicator.classList.toggle('opacity-0', !active);
                indicator.classList.toggle('scale-y-0', !active);
                indicator.classList.toggle('opacity-100', active);
                indicator.classList.toggle('scale-y-100', active);
            }
        });

        document.querySelectorAll('.swipe-dot').forEach(dot => {
            dot.className = parseInt(dot.dataset.index, 10) === index ? 'swipe-dot active' : 'swipe-dot';
        });

        document.querySelectorAll('.view-section').forEach(sec => {
            sec.classList.add('hidden');
            sec.classList.remove('animate-swipe-left', 'animate-swipe-right');
        });

        const section = $(viewId);
        if (!section) return;
        section.classList.remove('hidden');
        void section.offsetWidth; // restart the slide animation
        section.classList.add(direction === 'left' ? 'animate-swipe-left' : 'animate-swipe-right');
        this.onShow(viewId);
    }
}
