/**
 * JSON backup export / validated import across all repositories.
 */
import { APP_VERSION } from '../config.js';
import { uid } from '../utils.js';
import { normalizeTask } from './tasks.js';
import { normalizeLink } from './links.js';

/** Returns a function that hands out unique ids, keeping valid incoming ones. */
function idAllocator() {
    const seen = new Set();
    return (id) => {
        let out = (typeof id === 'string' || typeof id === 'number') ? String(id) : '';
        if (!out || seen.has(out)) out = uid();
        seen.add(out);
        return out;
    };
}

/**
 * Normalize untrusted rows. Validation runs first (id = null) so invalid rows
 * never reserve an id; survivors keep their id unless it is missing or duplicated.
 */
function keepValid(rows, normalize) {
    if (!rows) return undefined;
    const allocate = idAllocator();
    return rows
        .filter(row => normalize(row, null) !== null)
        .map(row => normalize(row, allocate(row.id)));
}

export function exportAll({ tasks, links, goals, settings }) {
    return JSON.stringify({
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        tasks: tasks.getAll(),
        goals: goals.get(),
        links: links.getAll(),
        settings: settings.get()
    }, null, 2);
}

/** Validates the whole payload first; writes nothing unless it is well-formed. */
export function importAll(repos, jsonString) {
    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error('Backup parse error', e);
        return false;
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    if ('tasks' in data && !Array.isArray(data.tasks)) return false;
    if ('links' in data && !Array.isArray(data.links)) return false;
    if (!('tasks' in data) && !('links' in data) && !('goals' in data)) return false;

    const tasks = keepValid(data.tasks, normalizeTask);
    const links = keepValid(data.links, normalizeLink);

    if (tasks) repos.tasks.save(tasks);
    if (links) repos.links.save(links);
    if (data.goals && typeof data.goals === 'object') {
        repos.goals.save(data.goals.shortTerm || '', data.goals.longTerm || '');
    }
    if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
        repos.settings.replace(data.settings);
    }
    return true;
}
