/**
 * Notification delivery + permission badge.
 */
import { i18n } from '../i18n.js';
import { $ } from './dom.js';

let permissionRequest = null;
let dueVibrationTimer = null;

const DUE_VIBRATION_PATTERN = [900, 250, 900, 650];

function startDueVibration() {
    stopDueAlert(false);
    const pulse = () => navigator.vibrate?.(DUE_VIBRATION_PATTERN);
    pulse();
    dueVibrationTimer = setInterval(pulse, 2700);
}

/** Stop the repeating mobile due-alert feedback and close its persistent notification. */
export function stopDueAlert(closeNotification = true) {
    if (dueVibrationTimer !== null) {
        clearInterval(dueVibrationTimer);
        dueVibrationTimer = null;
    }
    navigator.vibrate?.(0);
    if (closeNotification) {
        const registrationPromise = navigator.serviceWorker?.getRegistration?.();
        registrationPromise?.then(registration =>
            registration?.getNotifications?.({ tag: 'chronos-alert' })
                .then(notifications => notifications.forEach(notification => notification.close()))
        ).catch(() => {});
    }
}

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
    if (pre) navigator.vibrate?.([80]);
    else startDueVibration();
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

export function requestPermission(onUnsupported = null) {
    if (!('Notification' in window)) {
        if (onUnsupported) onUnsupported(i18n.t('notifyUnsupported'));
        else console.warn(i18n.t('notifyUnsupported'));
        return;
    }

    if (Notification.permission === 'granted') {
        renderPushBadge();
        return Promise.resolve('granted');
    }

    if (Notification.permission === 'denied') {
        renderPushBadge();
        if (onUnsupported) onUnsupported(i18n.t('notifyPermissionDenied'));
        return Promise.resolve('denied');
    }

    if (permissionRequest) return permissionRequest;

    permissionRequest = Notification.requestPermission().then(permission => {
        renderPushBadge();
        if (permission === 'granted') {
            showNotification(i18n.t('notifyEngagedTitle'), { body: i18n.t('notifyEngagedBody') });
        } else if (permission === 'denied' && onUnsupported) {
            onUnsupported(i18n.t('notifyPermissionDenied'));
        }
        return permission;
    }).catch(error => {
        console.warn('Notification permission request failed', error);
        return 'error';
    }).finally(() => {
        permissionRequest = null;
    });
    return permissionRequest;
}
