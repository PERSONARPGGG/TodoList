/**
 * Notification delivery + permission badge.
 */
import { i18n } from '../i18n.js';
import { $ } from './dom.js';

/**
 * Prefer the service-worker registration (required on Android Chrome, where `new Notification`
 * throws), even on the first visit before the SW controls the page.
 */
export function showNotification(title, options) {
    const opts = { icon: 'icon.svg', badge: 'icon.svg', ...options };
    const fallback = () => {
        try {
            new Notification(title, opts);
        } catch (e) {
            console.warn('Notification failed', e);
        }
    };
    if (!navigator.serviceWorker?.getRegistration) return fallback();
    navigator.serviceWorker.getRegistration()
        .then(reg => (reg ? reg.showNotification(title, opts) : fallback()))
        .catch(fallback);
}

/** Deliver a due alert (minutesLeft = null) or a heads-up alert. */
export function deliverAlert(title, minutesLeft = null) {
    const pre = minutesLeft !== null && minutesLeft !== undefined;
    if ('Notification' in window && Notification.permission === 'granted') {
        showNotification(i18n.t(pre ? 'preAlertTitle' : 'alertTitle'), {
            body: pre ? i18n.fn('preAlertBody', title, minutesLeft) : i18n.fn('alertBody', title),
            requireInteraction: !pre,
            tag: pre ? 'chronos-pre-alert' : 'chronos-alert'
        });
    }
    if (navigator.vibrate) navigator.vibrate(pre ? [80] : [200, 100, 200]);
}

export function renderPushBadge() {
    const badge = $('notify-badge');
    if (!badge) return;

    if (!('Notification' in window)) {
        badge.textContent = i18n.t('pushNA');
        return;
    }
    const granted = Notification.permission === 'granted';
    badge.textContent = i18n.t(granted ? 'pushOn' : 'pushOff');
    badge.parentElement.classList.toggle('text-emerald-400', granted);
}

export function requestPermission() {
    if (!('Notification' in window)) {
        alert(i18n.t('notifyUnsupported'));
        return;
    }
    Notification.requestPermission().then(permission => {
        renderPushBadge();
        if (permission === 'granted') {
            showNotification(i18n.t('notifyEngagedTitle'), { body: i18n.t('notifyEngagedBody') });
        }
    });
}
