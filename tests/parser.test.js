import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '../js/store.js';

// Fixed reference time: Fri 2026-11-13 14:00 KST
const NOW = new Date('2026-11-13T14:00:00+09:00');
const at = (iso) => new Date(iso).toISOString();
const plusMin = (m) => new Date(NOW.getTime() + m * 60000).toISOString();

let store;
beforeEach(() => {
    localStorage.clear();
    store = new Store();
});

const parse = (text) => store.parseQuickInput(text, new Date(NOW));

const cases = [
    // [input, title, expectedISO, isDaily]
    ['30분 뒤 코드리뷰', '코드리뷰', plusMin(30), false],
    ['30분후 코드리뷰', '코드리뷰', plusMin(30), false],
    ['30 min 코드리뷰', '코드리뷰', plusMin(30), false],
    ['30m 코드리뷰', '코드리뷰', plusMin(30), false],
    ['+30m 코드리뷰', '코드리뷰', plusMin(30), false],

    ['2시간 뒤 회의', '회의', plusMin(120), false],
    ['2 hours 회의', '회의', plusMin(120), false],
    ['2h 회의', '회의', plusMin(120), false],
    ['+2h 회의', '회의', plusMin(120), false],

    ['1시간 30분 뒤 운동', '운동', plusMin(90), false],

    ['Read 3 manuals', 'Read 3 manuals', plusMin(60), false],
    ['Review 3 PRs', 'Review 3 PRs', plusMin(60), false],
    ['2026 계획 수립', '2026 계획 수립', plusMin(60), false],

    ['오후 3시 미팅', '미팅', at('2026-11-13T15:00:00+09:00'), false],
    ['오전 9시 30분 조깅', '조깅', at('2026-11-14T09:30:00+09:00'), false],

    ['15:30 보고', '보고', at('2026-11-13T15:30:00+09:00'), false],
    ['08:00 보고', '보고', at('2026-11-14T08:00:00+09:00'), false],

    ['3pm call', 'call', at('2026-11-13T15:00:00+09:00'), false],
    ['9am standup', 'standup', at('2026-11-14T09:00:00+09:00'), false],
    ['3:30pm sync', 'sync', at('2026-11-13T15:30:00+09:00'), false],

    ['내일 14:00 회의', '회의', at('2026-11-14T14:00:00+09:00'), false],
    ['tomorrow 14:00 회의', '회의', at('2026-11-14T14:00:00+09:00'), false],
    ['내일 회의', '회의', at('2026-11-14T09:00:00+09:00'), false],
    ['모레 회의', '회의', at('2026-11-15T09:00:00+09:00'), false],

    ['매일 08:00 아침 브리핑', '아침 브리핑', at('2026-11-14T08:00:00+09:00'), true],
    ['daily 08:00 아침 브리핑', '아침 브리핑', at('2026-11-14T08:00:00+09:00'), true],
    ['매일 스트레칭', '스트레칭', at('2026-11-14T08:00:00+09:00'), true],

    ['25:00 test', '25:00 test', plusMin(60), false],
];

describe('Store.parseQuickInput (now = 2026-11-13 14:00 KST)', () => {
    it.each(cases)('%s -> title=%s time=%s daily=%s', (input, title, time, isDaily) => {
        const r = parse(input);
        expect({ title: r.title, time: r.time, isDaily: r.isDaily }).toEqual({ title, time, isDaily });
    });

    it('returns ISO string time', () => {
        const r = parse('15:30 보고');
        expect(r.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('empty title -> Quick Objective', () => {
        expect(parse('30분 뒤').title).toBe('Quick Objective');
        expect(parse('내일').title).toBe('Quick Objective');
    });

    it('collapses consecutive whitespace', () => {
        expect(parse('회의   자료    준비').title).toBe('회의 자료 준비');
        expect(parse('내일   14:00   팀   회의').title).toBe('팀 회의');
    });

    it('uses the now argument, not the wall clock', () => {
        const other = new Date('2030-01-01T00:00:00+09:00');
        const r = store.parseQuickInput('30분 뒤 x', other);
        expect(r.time).toBe(new Date(other.getTime() + 30 * 60000).toISOString());
    });

    it('resolves next week weekday and Korean afternoon time', () => {
        const r = parse('다음주 월요일 오후 5시 약속 일정 잡아줘');
        expect(r.title).toBe('약속');
        expect(r.time).toBe(at('2026-11-16T17:00:00+09:00'));
        expect(r.needsClarification).toBeUndefined();
    });

    it('asks for a concrete day when only a week is provided', () => {
        const r = parse('다음주 약속 잡아줘');
        expect(r.needsClarification).toBe(true);
        expect(r.time).toBeNull();
    });

    it('asks for a concrete day when only a month is provided', () => {
        const r = parse('다음달 회의');
        expect(r.needsClarification).toBe(true);
        expect(r.time).toBeNull();
    });
});
