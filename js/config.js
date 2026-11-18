/**
 * Single source of truth for app-wide constants.
 * Every localStorage key lives here so modules can never collide on a key name.
 */
export const APP_VERSION = '0.5.4';

export const STORAGE_KEYS = Object.freeze({
    tasks: 'chronos_objectives',
    goals: 'chronos_goals',
    links: 'chronos_links',
    settings: 'chronos_settings',
    lang: 'chronos_lang',
    alerted: 'chronos_alerted',
    seeded: 'chronos_seeded'
});

export const TASK_TYPES = Object.freeze(['critical', 'normal', 'low']);
export const LANGS = Object.freeze(['EN', 'KR', 'JP']);

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const DEFAULT_SETTINGS = Object.freeze({
    notificationsEnabled: false,
    notifyBeforeMinutes: 10,
    dailyBriefingTime: '08:00'
});
