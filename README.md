# ⚡️ Chronos: The Persona-Style Scheduler

## 🤖 AI Agent Guidelines (Must Read)
This document is the source of truth for any AI agent working on this project. 
The user (Dong-hyun) is an ENTJ, values extreme efficiency, modularity, and stylish minimalist design.

### 🎯 Core Philosophy
- **Offline-First & Fast**: Zero lag. Data lives in `localStorage` first. No waiting for API responses on the UI.
- **Modularity**: STRICT separation of concerns. Do not entangle UI logic with Data logic. If you update a feature, only touch its specific module to prevent cascading bugs.
- **Aesthetics**: Persona 4/5 vibe. Main color is Black. Points: Red, Yellow, Blue. Dynamic, bold typography, screen-takeover animations for date/time changes.
- **Language**: Mobile-first UI. Primary language is English (minimalistic/intuitive).
- **Stat Tracking**: Background data collection for his productivity analysis.

### 🏗️ Architecture
- **Vanilla JS**: No React/Next.js. Use ES6 Modules (`type="module"`).
- **Styling**: Tailwind CSS (CDN for now) + Custom CSS for complex animations.
- **Modules**:
  - `main.js`: Orchestrator.
  - `store.js`: LocalStorage wrapper, offline-first data layer.
  - `ui.js`: DOM manipulation, tab switching, rendering.
  - `time.js`: Countdown logic (in seconds).
  - `api/` (Future): Stubs for OpenRouter, Notion API, Gemini mailers.

### 🐛 Known Bugs / Current Status
- Status: v0.1.0 (Initial Prototype).
- Implemented: Base UI, Right-side tabs, Countdown timer, LocalStorage stub, Persona-style entry animation, strict module isolation.
- Pending: Offline/Online sync (Notion), Auto-rescheduling logic, Service Worker for Push Notifications.
