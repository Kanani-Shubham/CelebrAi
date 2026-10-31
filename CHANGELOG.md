# Changelog

All notable changes to CelebrAI are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-10-31

### Added
- **Complete 36-Page Route Architecture**: Implemented full navigation matrix across public onboarding, core planning modules, workspace management, and advanced features.
- **Groq GPT-OSS 120B Generative AI Integration**:
  - Multi-tab AI celebration plan generator (`/ai-plan-preview`).
  - Context-aware AI Mentor chatbot (`/ai`) with active event state injection and chat history.
  - Digital invitation and content studio (`/content-studio`).
- **Comprehensive Vitest Verification Suite**:
  - 14 automated test suites covering 134 unit and integration tests with a 100% pass rate.
  - Verification for AI schema generation, budget allocation math, date/overdue triggers, XSS sanitization, and IndexedDB caching.
- **Client-Side Media & Cache Optimization**:
  - HTML5 Canvas avatar compressor reducing image sizes to `<100 KB`.
  - IndexedDB binary blob storage for instant, zero-latency profile photo persistence.
- **Accessibility & Design System**:
  - High-contrast editorial color palette meeting WCAG 2.1 AA standards (Tuxedo Black `#171F20` over Soft Satin `#F7F1E8` yielding 14.8:1 contrast).
  - Keyboard navigation support, focus-visible outlines, and semantic ARIA labeling.
- **Multi-Tenant Firebase Security**:
  - Row-level Firestore security rules enforcing strict user isolation on `/users/{userId}` and `/events/{eventId}`.
  - Write-only public RSVP access on `/guests/{guestId}` without exposing event budget data.
- **Verified Visual Documentation**:
  - 39 authentic, high-resolution screenshots (21 desktop 1920×1080 and 18 mobile responsive captures) documented in `Docs/SCREENSHOT_INDEX.md`.

### Changed
- Refactored `App.tsx` with production error boundaries, route grouping, and a universal 36-page quick directory drawer.
- Isolated all AI API key requests to server-side endpoints (`server/api.js` and Netlify function `netlify/functions/api.js`).
- Enforced strict repository hygiene by untracking and gitignoring `.env.example` and all credential templates.

