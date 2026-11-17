/**
 * Safe localStorage access. The only module that touches localStorage directly
 * (besides tests), so quota/private-mode failures are handled in one place.
 */
export function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`Storage write failed for ${key}`, e);
        return false;
    }
}

export function readString(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function writeString(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch { /* private mode / quota */ }
}

export function has(key) {
    return readString(key) !== null;
}
