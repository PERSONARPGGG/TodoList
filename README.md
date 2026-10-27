# ⚡️ CHRONOS // Tactical Objective Protocol (v0.2.0)

## 🤖 AI Agent Guidelines & Project State
This document is the absolute source of truth for any AI agent interacting with this repository.
The user (Dong-hyun Shin) is an ENTJ software architect and AI engineer who values **extreme operational efficiency, rigorous time and resource control, robust modularity, and high-contrast, stylish aesthetics (Persona 4 / Persona 5 inspired)**.

### 🎯 Core Philosophy & Principles
- **Offline-First & Zero Latency**: Data is strictly stored and read locally (`localStorage`) first. Zero blocking on network or remote APIs.
- **Strict Modularity (Vanilla ES6)**:
  - NO heavy frontend frameworks (No React, No Next.js).
  - Code must remain clean, predictable, and modular:
    - `index.html`: Layout, Semantic Views, and Modals.
    - `style.css`: Persona aesthetic (Halftone, Skew, Slash polygon clips, high-contrast glow, 3D CSS transforms).
    - `js/store.js`: Isolated Data Layer (Tasks, Goals, Links, Stats, Settings). No DOM access.
    - `js/ui.js`: Presentation Layer (DOM manipulation, Swipe Gestures, 3D view transitions, Canvas/Slash effects).
    - `js/main.js`: Main Orchestrator (Lifecycle, Real-time clock & countdown tick).
    - `sw.js`: PWA Service Worker for offline asset caching and push foundation.
- **Visual Design Identity**:
  - Dominant Base: Pure Deep Black (`#08080a`).
  - Tactical Accent Colors: Persona Red (`#ff1f3d`), Neon Yellow (`#facc15`), Tactical Blue (`#38bdf8`), Emerald Green (`#10b981`).
  - Typography: Bebas Neue (Aggressive numbers/titles), Space Grotesk (Clean UI text), JetBrains Mono (Metadata/Status).
  - Motion: Jagged cut-ins, slash transition overlays, 3D perspective card flips on horizontal swipes.
- **Mobile-First Gestures**:
  - Full horizontal touch swipe support across the 3 main tactical tabs.

---

### 📦 Current Feature Set (v0.2.0)
1. **Prime Directive Counter (Header)**:
   - Real-time countdown rendered to the exact second in high-contrast neon font.
   - Dynamic states: Yellow (Standby/Normal) ➔ Pulsing Red (Less than 10 mins or Overdue).
   - Mission Complete button with instant slash visual feedback.
2. **Auto-Rescheduling Engine**:
   - Quick postpone options: `+15M`, `+1H`, `+1D`, and `Custom Minutes` modal.
   - Automatically tracks delay frequency per directive for efficiency analysis.
3. **Tactical Schedule (Tab 1)**:
   - Dual-view mode: **List View** (Timeline) vs **Calendar View** (Monthly grid with task activity dots).
   - Instant directive completion toggle, priority tier tags (CRITICAL, STANDARD, SECONDARY).
4. **Intelligence Matrix (Tab 2)**:
   - Real-time ENTJ Performance Metric: Completion Rate %, Total Delays, and Executive Grade (**RANK S / A / B / C**).
   - Short-Term Directive (This Month) & Long-Term Vision (Annual) with in-place modal editing.
   - Notification and sound alert toggles.
5. **Network Portals (Tab 3)**:
   - Central repository for favorite URLs, AI portals, and repositories.
   - Category filtering (`ALL`, `DEV`, `AI`, `FINANCE`, `OPS`) and quick-register modal.
6. **Mobile Touch Swiping**:
   - Swipe left/right anywhere on the main stage to switch between Schedule, Intel, and Network views with 3D perspective transitions.
7. **PWA & Offline Capability**:
   - Registered `sw.js` and `manifest.json`. Installable on mobile home screens (e.g., Galaxy S25).

---

### 🚀 Roadmap & Future Stubs
- [ ] Notion API Two-Way Background Queue (`api/notion.js`).
- [ ] Gemini 8AM Daily Briefing Webhook integration.
- [ ] LLM-based Meta Retrospective (Weekly efficiency commentary via OpenRouter).
