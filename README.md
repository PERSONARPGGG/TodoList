# ⚡️ CHRONOS // Tactical Objective Protocol (v0.5.2 Modular)

## 🤖 Dedicated AI Agents & Governance
1. `persona-stylist`: Motion director for Persona 4/5 comic-book panels, skewed angles, and kinetic 3D micro-animations.
2. `nlp-fast-parser`: Natural language parser for Korean/English expressions ("매일 08:00", "30분 뒤") and recurring routine engines.
3. `notion-sync-architect`: Cloud data architect managing offline queues, JSON exports/imports, and 2-way Notion API bridges.
4. `qa-guardian`: Mobile resilience and defensive coder preventing memory leaks, viewport shifts, and gesture conflicts.

---

### 🛠 Development
```bash
python -m http.server 5500 --bind 127.0.0.1   # http://localhost:5500/
npm install && npm test                         # vitest + jsdom
npm run build                                   # production bundle validation
```

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
