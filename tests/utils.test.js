import { describe, it, expect } from 'vitest';
import * as utils from '../js/utils.js';

const { escapeHTML, safeUrl, uid } = utils;

describe('escapeHTML', () => {
    it('escapes & < > " \'', () => {
        const out = escapeHTML(`&<>"'`);
        expect(out).not.toMatch(/[<>"']/);
        expect(out).toContain('&amp;');
        expect(out).toContain('&lt;');
        expect(out).toContain('&gt;');
        expect(out).toContain('&quot;');
        expect(out).toMatch(/&#39;|&#x27;|&apos;/i);
    });

    it('escapes a script payload', () => {
        expect(escapeHTML('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('does not double-handle plain text', () => {
        expect(escapeHTML('회의 준비 3')).toBe('회의 준비 3');
    });

    it('null / undefined -> empty string', () => {
        expect(escapeHTML(null)).toBe('');
        expect(escapeHTML(undefined)).toBe('');
    });
});

describe('safeUrl', () => {
    it('keeps http and https', () => {
        expect(safeUrl('https://example.com/a?b=1')).toMatch(/^https:\/\/example\.com\/a\?b=1$/);
        expect(safeUrl('http://example.com')).toMatch(/^http:\/\/example\.com\/?$/);
    });

    it('adds https:// when scheme missing', () => {
        expect(safeUrl('example.com')).toMatch(/^https:\/\/example\.com\/?$/);
        expect(safeUrl('notion.so/page')).toMatch(/^https:\/\/notion\.so\/page$/);
    });

    it.each([
        'javascript:alert(1)',
        'JavaScript:alert(1)',
        '  javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
    ])('blocks dangerous scheme %s -> #', (u) => {
        expect(safeUrl(u)).toBe('#');
    });

    it('returns a string', () => {
        expect(typeof safeUrl('example.com')).toBe('string');
    });
});

describe('uid', () => {
    it('is unique across 1000 consecutive calls', () => {
        const ids = new Set();
        for (let i = 0; i < 1000; i++) ids.add(uid());
        expect(ids.size).toBe(1000);
    });

    it('returns a non-empty string', () => {
        const id = uid();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
    });
});
