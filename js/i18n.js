/**
 * i18n — instant client-side translation (EN default, KR, JP).
 * Dictionaries live one-per-file in js/i18n/; add a language by adding a file
 * and registering it in DICTS + config.LANGS.
 */
import { STORAGE_KEYS, LANGS } from './config.js';
import { readString, writeString } from './data/storage.js';
import EN from './i18n/en.js';
import KR from './i18n/ko.js';
import JP from './i18n/ja.js';

const DICTS = { EN, KR, JP };

export const i18n = {
    dict: DICTS,

    currentLang: (() => {
        const saved = readString(STORAGE_KEYS.lang);
        return LANGS.includes(saved) ? saved : 'EN';
    })(),

    setLang(lang) {
        if (!DICTS[lang]) return;
        this.currentLang = lang;
        writeString(STORAGE_KEYS.lang, lang);
    },

    /** Look up a string; falls back to English, then to the key itself. */
    t(key) {
        const v = DICTS[this.currentLang]?.[key] ?? EN[key];
        return typeof v === 'string' ? v : key;
    },

    /** Call a function-valued entry, e.g. fn('inMins', 5). */
    fn(key, ...args) {
        const v = DICTS[this.currentLang]?.[key] ?? EN[key];
        return typeof v === 'function' ? v(...args) : key;
    },

    locale() {
        return this.t('locale');
    }
};
