# ⚡️ CHRONOS // Tactical Objective Protocol (v0.3.0 Kinetic)

## 🤖 Dedicated AI Agents & Governance
The following 4 specialized subagents are defined and available for this project via `invoke_subagent`:
1. `persona-stylist`: Motion director for Persona 4/5 comic-book panels, skewed angles, and kinetic 3D micro-animations.
2. `nlp-fast-parser`: Natural language parser for Korean/English time expressions ("매일 08:00", "30분 뒤") and recurring routine engines.
3. `notion-sync-architect`: Cloud data architect managing offline queues, JSON exports/imports, and 2-way Notion API bridges.
4. `qa-guardian`: Mobile resilience and defensive coder preventing memory leaks, viewport shifts, and gesture conflicts.

---

### 🎯 Core Philosophy & Principles
- **Offline-First & Zero Latency**: Data is strictly stored and read locally (`localStorage`) first. Zero blocking on network or remote APIs.
- **Strict Modularity (Vanilla ES6)**:
  - `index.html`: Layout, Semantic Views, and Modals.
  - `style.css`: Dynamic animated speedlines, tilted panels, polygon-cut cards, neon pulse glows.
  - `js/store.js`: Data Layer + NLP Quick Parser + Daily Routine Auto-Reset Engine + JSON Backup/Restore.
  - `js/ui.js`: Presentation Layer (DOM manipulation, 3D Swipe Gestures, Blade slash transitions).
  - `js/main.js`: Main Orchestrator (Lifecycle, Real-time clock & countdown tick).
  - `sw.js`: PWA Service Worker for offline asset caching and push foundation.
- **Visual Design Identity**:
  - Dominant Base: Pure Deep Black (`#060608`).
  - Tactical Accent Colors: Persona Red (`#ff1f3d`), Neon Yellow (`#facc15`), Tactical Blue (`#38bdf8`), Emerald Green (`#10b981`).
  - Slanted Asymmetrical Comic-Book Panels, Skewed Command Bar, Pulsing Countdown.

---

### 📦 Features in v0.3.0 Kinetic
1. **Fast Command Bar (Natural Language Quick Capture)**:
   - Instant capture at the top of Timeline: `▶ Enter objective (e.g. 매일 08:00 브리핑, 30분 뒤 검토)`.
   - Parses Korean/English relative and absolute times into ISO dates with zero modal clicks.
2. **Daily Routine Alarms (⚡ DAILY)**:
   - Mark tasks as daily recurring routines. Automatically resets every morning for the new day.
3. **Kinetic Persona Motion & Visual Overhaul**:
   - Skewed hero countdown box with heartbeat micro-pulse.
   - Slanted polygon task cards with dynamic drop-shadow on touch.
   - Infinite animated speedline background.
4. **JSON Backup & Restore (Offline Safeguard)**:
   - One-click `Export JSON Backup` and `Restore Backup` in the Intel tab.
5. **Auto-Rescheduling & Mission Completed Slashes**:
   - `+15M`, `+1H`, `+1D`, `Custom...` delay modal.
   - Screen-takeover blade slash cut-ins on objective engagement and completion.
6. **Mobile Touch Swiping & Mini-Calendar**:
   - 3D perspective blade transitions across 3 tabs (Schedule ↔ Intel ↔ Network).
   - Calendar grid with active task indicator dots.
