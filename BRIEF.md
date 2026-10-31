# CelebrAI — Executive Project Brief & Evaluator Guide

<p align="center">
  <img src="public/assets/branding/celebrai-logo.png" alt="CelebrAI Logo" width="220" />
</p>

<p align="center">
  <strong>Plan Smarter. Celebrate Better.</strong><br>
  An AI-powered celebration operating system bringing event ideation, AI blueprint generation, dynamic budget allocations, task run sheets, and a context-aware AI Mentor into one cohesive platform.
</p>

<p align="center">
  <a href="https://celebr-ai.netlify.app/"><strong>Live Application</strong></a> ·
  <a href="https://github.com/Kanani-Shubham/CelebrAi"><strong>Source Code</strong></a> ·
  <a href="https://www.instagram.com/reel/DfJckDCIOv7/"><strong>Instagram Reel</strong></a> ·
  <a href="Docs/README.md"><strong>Technical Documentation Hub</strong></a>
</p>

---

## ⚡ 2-Minute Executive Summary

**CelebrAI** eliminates the painful fragmentation of event planning. Rather than juggling disconnected spreadsheets, chat groups, notes apps, and generic AI chatbots, hosts access a unified, full-stack workspace powered by **Groq-accelerated GPT-OSS 120B**, **React 19**, and **Google Cloud Firestore**.

### Key Differentiators
1. **Instant AI Event Blueprints**: 4-step wizard turning event concepts into a complete blueprint (Summary, Milestones, Categorized Budget in ₹, and Timeline).
2. **Context-Aware AI Mentor**: Stateful copilot with full knowledge of active event budget, days remaining, guest counts, and session chat history.
3. **Smart Financial Tracking**: Dynamic budget allocation across 6 categories (Venue, Catering, Decor, Photography, Entertainment, Contingency) with budget vs. actual variance analysis.
4. **End-to-End Guest & RSVP Engine**: Public tokenized RSVP links allowing invitees to RSVP, specify party size, and record dietary preferences.
5. **Zero-Latency Client Caching**: HTML5 Canvas image compression (<100 KB) + IndexedDB avatar persistence for instant offline rendering.

---

## 🏆 Hack2Skill Evaluation Alignment (The 6 Factors)

| Factor | Implementation Summary | Primary Technical Proof |
|---|---|---|
| **1. Code Quality** | Modular React 19 + TypeScript architecture with **zero `any` types**. Oxlint syntax validation with **0 errors** across 78 files in 90ms. | [`src/types/index.ts`](src/types/index.ts), [`.oxlintrc.json`](.oxlintrc.json) |
| **2. Security** | Strict row-level Firestore rules; multi-tenant user isolation; zero API keys in client code or Git history; multi-pass XSS input sanitization. | [`firestore.rules`](firestore.rules), [`server/api.js`](server/api.js), [`src/utils/security.ts`](src/utils/security.ts) |
| **3. Efficiency** | Vite v8.3.5 build in **757ms**; 3-tier Rollup chunk splitting (`vendor-firebase`, `vendor-react`, `vendor-icons`); client-side Canvas compression (<100 KB); IndexedDB 0ms caching. | [`vite.config.ts`](vite.config.ts), [`Docs/PERFORMANCE.md`](Docs/PERFORMANCE.md) |
| **4. Testing** | **14 automated Vitest test suites** with **134/134 tests passed (100% pass rate)** in 1.99s. Full coverage across AI schemas, budget math, deadlines, and XSS sanitizers. | [`src/__tests__/`](src/__tests__/), [`Docs/TESTING_REPORT.md`](Docs/TESTING_REPORT.md) |
| **5. Accessibility** | Editorial luxury design system meeting WCAG 2.1 AA. Tuxedo Black (`#171F20`) on Soft Satin (`#F7F1E8`) yields a **14.8:1 contrast ratio (exceeding AAA)**; full keyboard navigation. | [`Docs/ACCESSIBILITY.md`](Docs/ACCESSIBILITY.md) |
| **6. Problem Alignment** | Fully solves celebration planning fragmentation through 36 connected routes, multi-step onboarding, AI blueprints, financial tracking, and public RSVPs. | [`src/App.tsx`](src/App.tsx), [`Docs/SCREENSHOT_INDEX.md`](Docs/SCREENSHOT_INDEX.md) |

---

## 🛠️ Technology Stack at a Glance

- **Frontend Core**: React v19.3.1, TypeScript v6.0.3, Vite v8.3.5, React Router v7.18.4
- **Backend & Cloud Services**: Google Cloud Firestore, Firebase Authentication, Node.js + Express, Netlify Serverless Functions
- **Generative AI Engine**: Groq Cloud API with `openai/gpt-oss-120b` (Groq LPU Inference)
- **Local Client Storage**: IndexedDB (`celebrai_avatars`) + HTML5 Canvas Compression Engine
- **Quality & Verification**: Vitest v2.1.9 (134 tests), Oxlint v1.88.0 (116 rules)

---

## 🗺️ Master Route Directory (36 Connected Pages)

CelebrAI includes all 36 feature screens accessible via direct routes or the persistent **"36 Pages"** floating drawer:

- **Public & Onboarding**: `/` (Landing), `/explore-events`, `/signin`, `/signup`, `/onboarding`, `/create-event`, `/ai-plan-preview`
- **Dashboard & Copilot**: `/dashboard`, `/events`, `/event-overview`, `/ai` (AI Mentor)
- **Core Planning**: `/tasks`, `/timeline`, `/budget`, `/expenses`, `/guests`, `/invitations`, `/vendors`, `/vendors/:id`, `/decor`, `/content-studio`
- **Workspace & Settings**: `/saved`, `/run-sheet`, `/team`, `/reports`, `/profile`, `/settings`, `/help`, `/privacy`, `/demo-states`, `/404`
- **Advanced Modules**: `/public-event`, `/guest-rsvp`, `/collaboration`, `/notifications`, `/subscription`, `/admin`

---

## 🔗 Official Submission Links

- **Live Netlify Demo**: [https://celebr-ai.netlify.app/](https://celebr-ai.netlify.app/)
- **GitHub Repository**: [https://github.com/Kanani-Shubham/CelebrAi](https://github.com/Kanani-Shubham/CelebrAi)
- **Instagram Reel**: [https://www.instagram.com/reel/DfJckDCIOv7/](https://www.instagram.com/reel/DfJckDCIOv7/)
- **Demo Video**: `[ADD_UNLISTED_YOUTUBE_OR_ACCESSIBLE_GOOGLE_DRIVE_URL]`
- **LinkedIn Post**: `[ADD_PUBLIC_LINKEDIN_POST_URL]`
- **Lead Developer**: Shubham Kanani (`shubhamkanani.2006@gmail.com`)
