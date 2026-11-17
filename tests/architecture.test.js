/**
 * Architecture guards: keep module boundaries, ids, translations and the SW cache list in sync.
 * These fail the moment someone adds a file, id or key in one place and forgets the other.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EN from '../js/i18n/en.js';
import KR from '../js/i18n/ko.js';
import JP from '../js/i18n/ja.js';
import { TEXT_BINDINGS } from '../js/ui/translate.js';
import { STORAGE_KEYS } from '../js/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const listJs = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? listJs(`${dir}/${d.name}`) : d.name.endsWith('.js') ? [`${dir}/${d.name}`] : []);

const jsFiles = listJs('js');
const html = read('index.html');
const htmlIds = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const importsOf = (file) => [...read(file).matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)]
    .map(m => path.posix.normalize(path.posix.join(path.posix.dirname(file), m[1])));

describe('layering', () => {
    it('core/ and data/ never touch the DOM', () => {
        for (const f of jsFiles.filter(f => /^js\/(core|data)\//.test(f))) {
            expect(read(f), f).not.toMatch(/\b(document|window)\./);
        }
    });

    it('only data/storage.js touches localStorage', () => {
        for (const f of jsFiles.filter(f => f !== 'js/data/storage.js')) {
            expect(read(f).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''), f).not.toMatch(/localStorage\./);
        }
    });

    it('storage keys are declared only in config.js', () => {
        for (const f of jsFiles.filter(f => f !== 'js/config.js')) {
            expect(read(f), f).not.toMatch(/['"]chronos_[a-z]+['"]/);
        }
        expect(new Set(Object.values(STORAGE_KEYS)).size).toBe(Object.values(STORAGE_KEYS).length);
    });

    it('no module assigns globals on window', () => {
        for (const f of jsFiles) expect(read(f), f).not.toMatch(/window\.[A-Za-z_$]+\s*=[^=]/);
    });

    it('core/ and data/ never import from ui', () => {
        for (const f of jsFiles.filter(f => /^js\/(core|data)\//.test(f))) {
            for (const dep of importsOf(f)) expect(dep, `${f} -> ${dep}`).not.toMatch(/^js\/ui(\/|\.js)/);
        }
    });

    it('ui views do not import each other (they coordinate through ui.js)', () => {
        const views = ['tasks', 'countdown', 'calendar', 'intel', 'links', 'navigation'].map(v => `js/ui/${v}.js`);
        for (const f of views) {
            for (const dep of importsOf(f)) expect(views, `${f} -> ${dep}`).not.toContain(dep);
        }
    });

    it('every relative import resolves to a real file', () => {
        for (const f of jsFiles) {
            for (const dep of importsOf(f)) expect(fs.existsSync(path.join(root, dep)), `${f} -> ${dep}`).toBe(true);
        }
    });
});

describe('DOM contract', () => {
    it('index.html has no duplicate ids', () => {
        const dupes = htmlIds.filter((id, i) => htmlIds.indexOf(id) !== i);
        expect(dupes).toEqual([]);
    });

    it('every $("id") used by the scripts exists in index.html', () => {
        const used = new Set(jsFiles.flatMap(f => [...read(f).matchAll(/\$\('([a-z0-9-]+)'\)|setText\('([a-z0-9-]+)'/g)].map(m => m[1] || m[2])));
        const missing = [...used].filter(id => !htmlIds.includes(id));
        expect(missing).toEqual([]);
    });

    it('every translation binding points at a real element and key', () => {
        for (const [id, key] of TEXT_BINDINGS) {
            expect(htmlIds, id).toContain(id);
            expect(EN, key).toHaveProperty(key);
        }
    });
});

describe('i18n dictionaries', () => {
    for (const [name, dict] of Object.entries({ KR, JP })) {
        it(`${name} has exactly the same keys and value types as EN`, () => {
            expect(Object.keys(dict).sort()).toEqual(Object.keys(EN).sort());
            for (const key of Object.keys(EN)) expect(typeof dict[key], `${name}.${key}`).toBe(typeof EN[key]);
        });
    }
});

describe('service worker', () => {
    const sw = read('sw.js');
    const assets = [...sw.match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'\.\/([^']*)'/g)].map(m => m[1]);

    it('precaches every JS module (offline first launch)', () => {
        const missing = jsFiles.filter(f => !assets.includes(f));
        expect(missing).toEqual([]);
    });

    it('lists only files that exist', () => {
        for (const a of assets.filter(Boolean)) expect(fs.existsSync(path.join(root, a)), a).toBe(true);
    });

    it('cache name matches APP_VERSION', async () => {
        const { APP_VERSION } = await import('../js/config.js');
        expect(sw).toContain(`chronos-v${APP_VERSION}`);
        expect(html).toContain(`main.js?v=${APP_VERSION}`);
    });
});
