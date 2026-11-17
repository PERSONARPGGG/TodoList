/**
 * Network-portal (bookmark) repository.
 */
import { STORAGE_KEYS } from '../config.js';
import { uid, safeUrl, assignUniqueIds } from '../utils.js';
import { readJSON, writeJSON, has } from './storage.js';

const DEFAULT_LINKS = [
    { title: 'Chronos GitHub Repo', category: 'DEV', url: 'https://github.com/PERSONARPGGG/TodoList.git' },
    { title: 'ETF Portfolio Tracker', category: 'FINANCE', url: 'https://finance.yahoo.com' },
    { title: 'Gemini AI Studio', category: 'AI', url: 'https://aistudio.google.com' },
    { title: 'Notion Workspace', category: 'OPS', url: 'https://notion.so' }
];

export function normalizeLink(raw, id) {
    if (!raw || typeof raw.title !== 'string' || !raw.title.trim() || typeof raw.url !== 'string' || !raw.url.trim()) return null;
    return {
        id,
        title: raw.title.trim(),
        category: String(raw.category || 'GENERAL').toUpperCase(),
        url: safeUrl(raw.url)
    };
}

export class LinkRepository {
    constructor(key = STORAGE_KEYS.links) {
        this.key = key;
    }

    ensureDefaults() {
        if (!has(this.key)) this.save(DEFAULT_LINKS.map(l => ({ id: uid(), ...l })));
    }

    getAll() {
        const links = readJSON(this.key, []);
        return Array.isArray(links) ? links : [];
    }

    save(links) {
        writeJSON(this.key, links);
    }

    add(title, category, url) {
        const links = this.getAll();
        const link = normalizeLink({ title: String(title), category, url: String(url) }, uid());
        if (!link) return null;
        links.push(link);
        this.save(links);
        return link;
    }

    remove(id) {
        this.save(this.getAll().filter(l => l.id !== id));
    }

    repairIds() {
        const links = this.getAll();
        if (assignUniqueIds(links)) this.save(links);
    }
}
