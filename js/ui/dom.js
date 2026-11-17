/**
 * Tiny DOM helpers shared by every view.
 */
export const $ = (id) => document.getElementById(id);

export function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
}

/** Fire `handler(el, event)` when a click lands on (or inside) an element matching `selector`. */
export function delegate(root, selector, handler, type = 'click') {
    root?.addEventListener(type, (e) => {
        const el = e.target.closest?.(selector);
        if (el && root.contains(el)) handler(el, e);
    });
}

/** Make Enter / Space on a focusable non-button element behave like a click. */
export function activateOnKey(el, onActivate) {
    el?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onActivate(e);
    });
}
