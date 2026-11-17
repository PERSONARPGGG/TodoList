/**
 * Persona-style full-screen slash effects (intro date card, action confirmations).
 */
import { $ } from './dom.js';

let overlayTimer = null;

function showOverlay(durationMs) {
    const overlay = $('date-transition');
    overlay.style.display = 'flex';
    // A rapid second effect must not let the older timer hide the newer overlay early.
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => { overlay.style.display = 'none'; }, durationMs);
}

export function playIntroAnimation() {
    const text = $('transition-text');
    if (!$('date-transition') || !text) return;

    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    text.textContent = `${days[now.getDay()]} ${now.getDate()}`;
    text.classList.add('animate-persona');
    showOverlay(750);
}

export function playSlashEffect(message) {
    const text = $('transition-text');
    if (!$('date-transition') || !text) return;

    text.className = 'font-bebas text-6xl md:text-8xl tracking-wider text-emerald-400 transform scale-125';
    text.textContent = message;
    void text.offsetWidth; // restart the CSS animation
    text.classList.add('animate-persona');
    if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
    showOverlay(650);
}
