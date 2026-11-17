/**
 * Goals + settings repositories (small single-object records).
 */
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../config.js';
import { readJSON, writeJSON, has } from './storage.js';

const DEFAULT_GOALS = {
    shortTerm: 'Deploy Chronos PWA & Establish Daily Routine',
    longTerm: 'Automate 100% of Daily AI Engineering Workflows'
};

export class GoalRepository {
    constructor(key = STORAGE_KEYS.goals) {
        this.key = key;
    }

    ensureDefaults() {
        if (!has(this.key)) writeJSON(this.key, DEFAULT_GOALS);
    }

    get() {
        const g = readJSON(this.key, null);
        return { shortTerm: g?.shortTerm || '', longTerm: g?.longTerm || '' };
    }

    save(shortTerm, longTerm) {
        writeJSON(this.key, { shortTerm: String(shortTerm ?? ''), longTerm: String(longTerm ?? '') });
    }
}

export class SettingsRepository {
    constructor(key = STORAGE_KEYS.settings) {
        this.key = key;
    }

    ensureDefaults() {
        if (!has(this.key)) writeJSON(this.key, DEFAULT_SETTINGS);
    }

    get() {
        const s = readJSON(this.key, null);
        return s && typeof s === 'object' && !Array.isArray(s) ? s : {};
    }

    replace(settings) {
        writeJSON(this.key, settings);
    }
}
