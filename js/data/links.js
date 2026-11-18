/**
 * Network-portal (bookmark) repository.
 */
import { STORAGE_KEYS } from '../config.js';
import { uid, safeUrl, assignUniqueIds } from '../utils.js';
import { readJSON, writeJSON, has } from './storage.js';

const DEFAULT_LINKS = [];
const LEGACY_SAMPLE_TITLES = new Set(['Chronos GitHub Repo', 'ETF Portfolio Tracker', 'Gemini AI Studio', 'Notion Workspace']);

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
        else {
            const existing = this.getAll();
            if (existing.length === LEGACY_SAMPLE_TITLES.size && existing.every(link => LEGACY_SAMPLE_TITLES.has(link.title))) {
                this.save([]);
            }
        }
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

    update(id, patch) {
        const links = this.getAll();
        const index = links.findIndex(link => link.id === id);
        if (index < 0) return null;
        const updated = normalizeLink({ ...links[index], ...patch }, id);
        if (!updated) return null;
        links[index] = updated;
        this.save(links);
        return updated;
    }

    remove(id) {
        this.save(this.getAll().filter(l => l.id !== id));
    }

    repairIds() {
        const links = this.getAll();
        if (assignUniqueIds(links)) this.save(links);
    }
}
