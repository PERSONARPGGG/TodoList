/**
 * Shared helpers (no DOM dependencies).
 */

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape a value for safe interpolation into HTML text or quoted attributes. */
export function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

/** Allow only http(s) URLs. Scheme-less input gets https://. Anything else → '#'. */
export function safeUrl(url) {
    const raw = String(url ?? '').trim();
    if (!raw) return '#';
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
    const candidate = hasScheme ? raw : `https://${raw.replace(/^\/+/, '')}`;
    try {
        const parsed = new URL(candidate);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
    } catch {
        /* fall through */
    }
    return '#';
}

let uidCounter = 0;
/** Collision-free id, even for calls within the same millisecond. */
export function uid() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    uidCounter = (uidCounter + 1) % 1e6;
    return `${Date.now().toString(36)}-${uidCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** True when two dates fall on the same local calendar day. */
export function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isValidDate(value) {
    const d = new Date(value);
    return !Number.isNaN(d.getTime());
}

/** Mutates items so every id is a unique, non-empty string. */
export function assignUniqueIds(items) {
    const seen = new Set();
    let changed = false;

    items.forEach(item => {
        const current = item?.id === undefined || item?.id === null ? '' : String(item.id);
        if (!current || seen.has(current)) {
            item.id = uid();
            changed = true;
        } else if (item.id !== current) {
            item.id = current;
            changed = true;
        }
        seen.add(item.id);
    });

    return changed;
}
