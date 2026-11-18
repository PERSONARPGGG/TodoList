# ⚡️ CHRONOS // Tactical Objective Protocol (v0.5.2)

CHRONOS는 자연어로 일정을 입력하고 카운트다운, 반복 일정, 캘린더, 생산성 요약, PWA 오프라인 동작을 한 화면에서 관리하는 클라이언트 사이드 일정 앱입니다.

현재 상태: 핵심 기능 구현과 안정화가 완료되었고, 테스트 및 프로덕션 빌드가 통과합니다. 개발 모드에서만 샘플 일정이 생성되며 운영 빌드에는 샘플 데이터가 포함되지 않습니다.

모바일 만료 알림은 유지형 OS 알림, 반복 진동, `알림 종료` 모달을 사용합니다. 모바일에서는 캘린더 중심 화면과 하단 탭을 사용하고, PC 레이아웃은 기존 우측 탭과 생산성 정보를 유지합니다.

## 🤖 Dedicated AI Agents & Governance
1. `persona-stylist`: Motion director for Persona 4/5 comic-book panels, skewed angles, and kinetic 3D micro-animations.
2. `nlp-fast-parser`: Natural language parser for Korean/English expressions ("매일 08:00", "30분 뒤") and recurring routine engines.
3. `notion-sync-architect`: Cloud data architect managing offline queues, JSON exports/imports, and 2-way Notion API bridges.
4. `qa-guardian`: Mobile resilience and defensive coder preventing memory leaks, viewport shifts, and gesture conflicts.

---

### 🛠 Development
```bash
npm.cmd install
npm.cmd test                                    # Vitest + jsdom, 현재 96개 테스트
npm.cmd run build                               # Vite production bundle validation
```

PowerShell 실행 정책에 따라 `npm` 대신 `npm.cmd`를 사용해야 할 수 있습니다.

### 개발 서버와 포트

포트 충돌을 피하기 위해 실행 시 포트를 직접 지정합니다. `vite.config.js`의 기본 포트는 변경하지 않았습니다.

```bash
npm.cmd run dev -- --port 5187
```

브라우저에서 `http://127.0.0.1:5187/`로 접속합니다. 다른 로컬 서비스가 사용 중이면 `5187`을 비어 있는 포트로 바꿉니다.

프로덕션 미리보기:

```bash
npm.cmd run build
npm.cmd run preview -- --port 5187
```

### GitHub Pages 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 테스트와 프로덕션 빌드를 실행한 뒤 GitHub Pages에 `dist`를 자동 배포합니다. 프로젝트 사이트 경로(`/TodoList/`)를 지원하도록 빌드 asset은 상대 경로로 생성됩니다.

배포 주소: `https://personarpggg.github.io/TodoList/`

### 🧱 Module Map (v0.5.2)
```
js/
├─ main.js            entry: boot, 1s clock, SW registration
├─ config.js          APP_VERSION, ALL storage keys, constants
├─ utils.js           escapeHTML, safeUrl, uid, date helpers
├─ store.js           data facade (the only API the UI uses)
├─ i18n.js            translator  ── i18n/en.js · ko.js · ja.js
├─ ui.js              UI coordinator + shared view state
├─ core/   (pure, no DOM)  parser · recurrence · alerts
├─ data/   (no DOM)        storage(only localStorage access) · tasks · links · profile · backup
└─ ui/     (one file per screen area)
           tasks · countdown · calendar · intel · links · navigation
           modals · effects · notifications · translate · dom
```
Rules enforced by `tests/architecture.test.js`: core/data never touch the DOM or import ui; only `data/storage.js` touches localStorage; storage keys only in `config.js`; views never import each other; no `window.*` globals; every `$('id')` exists in index.html; KR/JP dictionaries match EN keys; `sw.js` precaches every module and its cache name matches `APP_VERSION`.

### 🩹 v0.5.1 Hardened (Hotfix)
- **Security**: all user/imported strings are HTML-escaped; links restricted to http(s); inline `onclick` handlers replaced with event delegation.
- **Data integrity**: collision-free ids (`crypto.randomUUID`) with automatic repair of duplicate ids from older versions; backup import validated before any write.
- **Alerts**: expired-task notification fires once per task/time instead of every second; delivered via the service worker when available.
- **Offline/PWA**: service worker is actually registered now; cache list includes every module and fonts.
- **Parser**: no more false matches on bare numbers ("Review 3 PRs"); supports `1시간 30분 뒤`, `3pm`, `3:30pm`, `3시반`, `모레`, `in 45 minutes`.
- **Daily routines**: missed daily runs roll forward instead of staying overdue forever; year-safe day comparison.
- **i18n**: modal buttons, calendar month/weekdays, effects, alerts and dates follow the selected language.
- **Mobile**: `100dvh` layout, safe-area insets, swipe ignores horizontal chip rows/inputs, ESC/backdrop closes modals, reduced-motion support.

### ✅ 현재 진행 상황

- EN / KR / JP 언어 전환과 날짜·모달·알림 번역 완료
- 자연어 일정 파싱, 일일 반복, 누락 실행일 보정 완료
- localStorage 저장, JSON 백업/복원, 링크 검증 완료
- 서비스 워커 기반 PWA 캐시와 개발 모드 SW 해제 처리 완료
- 입력값 escaping, 중복 ID 복구, 만료 알림 중복 방지 완료
- 모바일 safe-area, `100dvh`, 스와이프·모달·ESC·reduced-motion 대응 완료
- `npm.cmd test` 96개 통과, `npm.cmd run build` 성공

### 🚀 배포 전 체크리스트

1. `npm.cmd test`
2. `npm.cmd run build`
3. 모바일 뷰포트에서 일정 추가, 언어 전환, 모달, 캘린더, 완료/삭제 동작 확인
4. HTTPS 환경에서 서비스 워커와 알림 권한 확인
5. 현재 데이터는 브라우저별 localStorage에 저장되므로 기기 간 동기화가 필요하면 별도 백엔드 또는 Notion 연동 구현

---

### 🚀 Core Architecture & Refinements (v0.5.0 Snappy)
- **Zero-Latency Snappy Transitions (0.12s ~ 0.16s)**:
  - Eliminated sluggish blurs and excessive 3D perspectives.
  - Razor-sharp, lightweight, instant responses across all interactions.
- **Pure Obsidian Matte Black Studio Background**:
  - Completely removed loud and messy speedline grid patterns.
  - 100% clean, deep obsidian black studio backdrop with subtle radial dark lighting.
- **Instant Client-Side Multilingual Engine (EN | KR | JP)**:
  - Default: English (`EN`).
  - Seamless 1-tap switching between **English, Korean, and Japanese** in the top status bar.
  - Translates directives, headers, timers, relative time stamps, and modals in 0ms without page reloads.
- **High-End Ambient Text Box (`.chronos-cmd-bar`, `.chronos-input`)**:
  - Independent, bulletproof CSS classes ensuring high specificity and zero Tailwind CDN conflicts.
  - Smooth neon red focus ring and high-end obsidian dark input field.
- **Calm & Dignified Cyber Hourglass**:
  - Completely static and dignified with glowing sand-drop stream; zero violent shaking on task expiration.
