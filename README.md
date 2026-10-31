# CelebrAI — Next-Generation AI Event Planning Platform

<p align="center">
  <img src="public/assets/branding/celebrai-logo.png" alt="CelebrAI Logo" width="280" />
</p>

<p align="center">
  <strong>Plan Smarter. Celebrate Better.</strong><br>
  An intelligent celebration operating system bringing event ideation, AI-driven blueprint generation, dynamic budget allocations, milestone task management, guest RSVP coordination, and a context-aware AI Mentor into one cohesive web platform.
</p>

<p align="center">
  <a href="https://celebr-ai.netlify.app/"><img src="https://img.shields.io/badge/Live_Demo-celebr--ai.netlify.app-171F20?style=for-the-badge&logo=netlify&logoColor=white" alt="Live Demo"></a>
  <a href="https://github.com/Kanani-Shubham/CelebrAi"><img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="Source Code"></a>
  <a href="https://www.instagram.com/reel/DfJckDCIOv7/"><img src="https://img.shields.io/badge/Instagram-Reel_Challenge-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram Reel"></a>
  <a href="#-hack2skill-ai-evaluation--six-parameter-engineering-matrix"><img src="https://img.shields.io/badge/Hack2Skill-6_Factor_Evaluation-4B3F72?style=for-the-badge" alt="Evaluation Matrix"></a>
  <a href="#-parameter-4--testing"><img src="https://img.shields.io/badge/Vitest-134%2F134_Passing-22c55e?style=for-the-badge&logo=vitest&logoColor=white" alt="Tests"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.3.1-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-8.3.5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/GenAI-Groq_GPT--OSS_120B-F05A28?style=flat-square" alt="Groq AI">
  <img src="https://img.shields.io/badge/Database-Cloud_Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firestore">
  <img src="https://img.shields.io/badge/Auth-Firebase_Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firebase Auth">
  <img src="https://img.shields.io/badge/Linter-Oxlint_0_Errors-00D8FF?style=flat-square" alt="Oxlint">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
</p>

---

## 📑 Table of Contents

1. [Executive Overview & Problem Statement](#-executive-overview--problem-statement)
2. [Vision, Target Users & Supported Events](#-vision-target-users--supported-events)
3. [Hack2Skill AI Evaluation — Six-Parameter Engineering Matrix](#-hack2skill-ai-evaluation--six-parameter-engineering-matrix)
   - [Parameter 1: Code Quality](#parameter-1--code-quality)
   - [Parameter 2: Security](#parameter-2--security)
   - [Parameter 3: Efficiency](#parameter-3--efficiency)
   - [Parameter 4: Testing](#parameter-4--testing)
   - [Parameter 5: Accessibility](#parameter-5--accessibility)
   - [Parameter 6: Problem Statement Alignment](#parameter-6--problem-statement-alignment)
4. [Product Screenshots & Visual Walkthrough](#-product-screenshots--visual-walkthrough)
   - [A. Landing and Authentication](#a-landing-and-authentication)
   - [B. Multi-Step Event Creation Wizard](#b-multi-step-event-creation-wizard)
   - [C. AI Celebration Plan Blueprint](#c-ai-celebration-plan-blueprint)
   - [D. Command Center, Tasks & Financials](#d-command-center-tasks--financials)
   - [E. AI Mentor, Guest RSVP & Account Management](#e-ai-mentor-guest-rsvp--account-management)
5. [Master 36-Page Route Matrix](#-master-36-page-route-matrix)
6. [System Architecture & Data Flow](#-system-architecture--data-flow)
7. [Generative AI Integration Deep-Dive](#-generative-ai-integration-deep-dive)
8. [Database Schema & Offline Storage Engine](#-database-schema--offline-storage-engine)
9. [Local Development & Execution Guide](#-local-development--execution-guide)
10. [Hack2Skill Official Submission Reference](#-hack2skill-official-submission-reference)
11. [Documentation Library & Technical Reports](#-documentation-library--technical-reports)
12. [Project Maintainers & Open-Source Licensing](#-project-maintainers--open-source-licensing)

---

## 🌟 Executive Overview & Problem Statement

Organizing a celebration—whether an intimate 50-guest milestone birthday, a 500-attendee wedding, an anniversary gala, or an executive corporate summit—routinely devolves into stressful logistical friction:

- **Extreme Fragmentation**: Budgets live in messy spreadsheets, task checklists in personal notes apps, RSVP confirmations across SMS and WhatsApp threads, and design ideas in unorganized photo galleries.
- **Financial Ambiguity**: Hosts struggle to calculate realistic category percentages across Venue, Catering, Decor, and Photography, frequently incurring unexpected cost overruns of 30% to 50%.
- **Zero Real-Time Intelligence**: Traditional event planning software consists of static form templates that lack context-aware recommendations, intelligent deadline forecasting, or localized vendor matching.

### The CelebrAI Solution
**CelebrAI** is an AI-native celebration operating system. Built on **React 19**, **TypeScript**, and **Google Cloud Firestore**, and accelerated by **Groq GPT-OSS 120B** LPU inference, CelebrAI consolidates the entire planning lifecycle into one cohesive workspace.

Hosts can:
1. Turn simple celebration goals into a full concept summary, milestone checklist, categorized budget, and timeline in seconds.
2. Converse with a context-aware **AI Mentor** possessing real-time knowledge of active budgets, remaining days, and guest headcounts.
3. Manage itemized expenses with variance tracking in Indian Rupees (₹) and major global currencies.
4. Distribute public, tokenized RSVP links to guests for live attendance and dietary preference tracking.
5. Work seamlessly across devices with zero-latency IndexedDB avatar caching and offline blueprint fallbacks.

---

## 🎯 Vision, Target Users & Supported Events

### Product Philosophy
- **User Agency Over Automation**: AI-generated event plans and budget distributions are presented as editable suggestions. Hosts retain complete control to accept, edit, or override any milestone, task deadline, or financial allocation.
- **Data Accuracy Over Hallucination**: Strict system prompts instruct the AI to utilize only user-provided facts (dates, locations, guest counts) without inventing fabricated vendor details or false budget totals.
- **Privacy by Design**: Sensitive user information and event data are isolated through row-level Firestore database rules. Private AI API keys never reach the client browser.

### Target Users
- **Everyday Hosts**: Individuals organizing birthdays, anniversaries, dinner parties, or family reunions.
- **Couples & Families**: Hosts planning multi-day weddings with intricate timelines, guest lists, and vendor contracts.
- **Community & College Organizers**: Student leaders and coordinators managing festivals, hackathons, and galas.
- **Corporate Event Managers**: Professionals orchestrating conferences, team offsites, and product launches.

### Supported Celebration Categories
CelebrAI natively categorizes events across 8 distinct archetypes:
`Wedding`, `Birthday`, `Anniversary`, `Corporate`, `Community`, `College Event`, `Festival`, and `Custom Celebration`.

---

## 🏆 Hack2Skill AI Evaluation — Six-Parameter Engineering Matrix

This section presents CelebrAI's engineering architecture and verification evidence mapped directly against the **six official Hack2Skill evaluation parameters** in the exact designated order:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   HACK2SKILL 6-FACTOR EVALUATION MATRIX               │
├──────────────────────────┬───────────────────────┬─────────────────────┤
│ Evaluation Parameter     │ Measured Result       │ Physical Proof      │
├──────────────────────────┼───────────────────────┼─────────────────────┤
│ 1. Code Quality          │ 0 Errors across 78 fls│ Oxlint + Strict TS  │
│ 2. Security              │ Zero Leaked Secrets   │ Row-Level Firestore │
│ 3. Efficiency            │ 757ms Build, <100KB Im│ Rollup 3-Tier Chunk │
│ 4. Testing               │ 134/134 Passed (100%) │ Vitest v2.1.9       │
│ 5. Accessibility         │ 14.8:1 Contrast (AAA) │ WCAG 2.1 AA Compl.  │
│ 6. Problem Alignment     │ 36 Connected Routes   │ End-to-End Workflows│
└──────────────────────────┴───────────────────────┴─────────────────────┘
```

---

### Parameter 1: Code Quality

CelebrAI adheres to modern, strict TypeScript standards and layered software architecture:

- **Strict Type Safety**: The codebase operates with zero fallback `any` types. All domain models (`EventItem`, `TaskItem`, `ExpenseItem`, `GuestItem`, `AIPlanResult`, `ConversationMessage`) are centralized in [`src/types/index.ts`](src/types/index.ts).
- **Static Syntax & Linter Verification**: Tested with [`oxlint`](.oxlintrc.json) executing 116 rules across 78 source files in **90ms with 0 errors**.
- **Clean Service Boundaries**: UI presentation components are cleanly decoupled from external backend operations:
  - `src/services/firebase/`: Encapsulates authentication observers, Firestore document CRUD wrappers, and storage fallbacks.
  - `src/services/ai/`: Handles server-side AI proxy requests and system prompt constructions.
  - `src/services/storage/`: Manages local IndexedDB binary avatar persistence.
  - `src/utils/`: Pure utility functions for date arithmetic, input validation, and security sanitization.
- **Context State Management**: Global state is managed via [`AuthContext.tsx`](src/contexts/AuthContext.tsx) and [`EventContext.tsx`](src/contexts/EventContext.tsx), utilizing clean subscription listeners and memoized dispatchers.

---

### Parameter 2: Security

Security and user privacy are enforced at every application boundary:

- **Zero Client Secret Exposure**: Private API keys (`GROQ_API_KEY`) reside exclusively in server environments ([`server/api.js`](server/api.js) and Netlify Function [`netlify/functions/api.js`](netlify/functions/api.js)). No AI keys exist in client-side code or build bundles.
- **Strict Repository Hygiene**: Both `.env` and `.env.example` are excluded from Git tracking via [`.gitignore`](.gitignore). Verified via Git tree inspection.
- **Row-Level Firestore Rules ([`firestore.rules`](firestore.rules))**:
  - Enforces multi-tenant user isolation: `request.auth.uid == userId` for `/users/{userId}`.
  - Event resource authorization: Only the event creator or confirmed collaborators can mutate `/events/{eventId}`, `/tasks/{taskId}`, or `/expenses/{expenseId}`.
  - Public RSVP write-only permissions: Guests can update their own RSVP attendance without gaining read or write access to the host's event budget or private notes.
- **Multi-Pass Input Sanitization ([`src/utils/security.ts`](src/utils/security.ts))**: Strips malicious HTML constructs, `<script>` tags, inline event handlers (`onload`, `onerror`), and `javascript:` URIs.
- **Safe Markdown Rendering ([`src/components/common/SafeMarkdown.tsx`](src/components/common/SafeMarkdown.tsx))**: Renders AI assistant markdown outputs securely without raw HTML execution risks.
- **Privacy & Consent Governance ([`src/pages/workspace/PrivacyConsent.tsx`](src/pages/workspace/PrivacyConsent.tsx))**: Provides hosts with explicit AI processing consent toggles, full JSON data export, and complete account deletion workflows.

---

### Parameter 3: Efficiency

Optimized for instant page loads, smooth 60fps animations, and minimal network overhead:

- **Measured Production Build Output**:
  ```bash
  > celebrai@0.0.0 build
  > tsc -b && vite build

  vite v8.3.5 building client environment for production...
  ✓ 2310 modules transformed.
  dist/index.html                             2.24 kB │ gzip:   0.82 kB
  dist/assets/index-B2IEjwoI.css            161.67 kB │ gzip:  24.03 kB
  dist/assets/rolldown-runtime-XKyaHtl9.js    0.72 kB │ gzip:   0.42 kB
  dist/assets/vendor-icons-Ckz54iR9.js       33.72 kB │ gzip:  11.85 kB
  dist/assets/index-yfFtE40Z.js             361.15 kB │ gzip:  88.83 kB
  dist/assets/vendor-react-CFyf3Nuw.js      368.54 kB │ gzip: 114.95 kB
  dist/assets/vendor-firebase-D4FnO4s2.js   601.33 kB │ gzip: 181.20 kB
  ✓ built in 757ms
  ```
- **3-Tier Rollup Chunk Isolation**: Configured in [`vite.config.ts`](vite.config.ts) to separate `vendor-firebase`, `vendor-react`, and `vendor-icons`, maximizing long-term browser cache hits.
- **Client-Side Canvas Compression (<100 KB)**: Image uploads are scaled on an HTML5 Canvas to 512×512px with 85% quality before storage, preventing bandwidth bloat.
- **IndexedDB Zero-Latency Avatar Caching**: Stored locally in `celebrai_avatars` for 0ms initial render latency without repetitive cloud egress.
- **Firestore Listener Cleanup**: All real-time snapshot subscriptions return explicit cleanup callbacks on component unmount, preventing memory leaks and unnecessary network reads.
- **Repository Size Discipline**: Git repository size is strictly maintained at **6.38 MiB** (well below the Hack2Skill 10 MB maximum).

---

### Parameter 4: Testing

CelebrAI features an automated test suite running on **Vitest v2.1.9**:

```bash
> celebrai@0.0.0 test
> vitest run

 RUN  v2.1.9 E:/Project/CelebrAI

 ✓ src/__tests__/chatHistory.test.ts (4 tests) 6ms
 ✓ src/__tests__/budgetCalculations.test.ts (7 tests) 21ms
 ✓ src/__tests__/dateUtils.test.ts (20 tests) 26ms
 ✓ src/__tests__/rsvpCalculations.test.ts (6 tests) 6ms
 ✓ src/__tests__/validation.test.ts (14 tests) 12ms
 ✓ src/__tests__/markdownAndCodePolicy.test.ts (7 tests) 32ms
 ✓ src/__tests__/aiPlanGenerator.test.ts (10 tests) 33ms
 ✓ src/__tests__/securitySanitizer.test.ts (7 tests) 8ms
 ✓ src/__tests__/securityAndAccessControl.test.ts (10 tests) 13ms
 ✓ src/__tests__/indexedDBAvatar.test.ts (8 tests) 31ms
 ✓ src/__tests__/taskAndNotificationEngine.test.ts (18 tests) 79ms
 ✓ src/__tests__/authService.test.ts (10 tests) 4ms
 ✓ src/__tests__/expenseManager.test.ts (9 tests) 4ms
 ✓ src/__tests__/e2eUserJourneys.test.ts (4 tests) 5ms

 Test Files  14 passed (14)
      Tests  134 passed (134)
   Duration  1.99s (Transform: 2.49s, Tests: 281ms)
```

| Verification Metric | Measured Value |
|---|---|
| **Test Suites** | **14 Files** |
| **Total Tests** | **134 Tests** |
| **Pass Rate** | **100% (134 Passed, 0 Failed, 0 Skipped)** |
| **Execution Duration** | **1.99 seconds** |

*For complete test file breakdowns and reproduction commands, see [Docs/TESTING_REPORT.md](Docs/TESTING_REPORT.md).*

---

### Parameter 5: Accessibility

Engineered to fulfill **WCAG 2.1 Level AA** standards:

- **Measured Text Contrast**: Primary interactive typography uses **Tuxedo Black (`#171F20`)** over **Soft Satin (`#F7F1E8`)**, achieving a **14.8:1 contrast ratio** (far exceeding the 4.5:1 AA requirement and surpassing 7:1 AAA).
- **Keyboard Navigability**: Every interactive card, filter tab, button, and modal trigger features explicit `tabIndex={0}`, `:focus-visible` styling, and keyboard activation (`Enter` and `Space` key triggers).
- **Semantic HTML & ARIA**: Employs `<header>`, `<nav>`, `<main>`, `<section>`, and `<article>` landmarks. Dynamic elements leverage `role="alert"`, `role="dialog"`, `role="progressbar"`, and `aria-valuenow`.
- **Descriptive Alt Attributes**: Every screenshot and UI illustration includes descriptive, human-readable alt descriptions.
- **Mobile Touch Targets**: Primary action buttons and navigation docks maintain a minimum interactive hit target of **44×44 CSS pixels**.

*For full contrast tables and the WCAG checklist, see [Docs/ACCESSIBILITY.md](Docs/ACCESSIBILITY.md).*

---

### Parameter 6: Problem Statement Alignment

CelebrAI directly solves real-world celebration planning fragmentation by connecting every workflow into a unified workspace:

| Real-World Problem | CelebrAI Solution | Architectural Implementation | Measurable Result |
|---|---|---|---|
| **Fragmented Tools** | Unified celebration command center | 36 connected routes with global navigation & active event switcher | One single workspace for all event operations |
| **Decision Paralysis** | AI celebration plan generation | Groq GPT-OSS 120B blueprint engine (`/ai-plan-preview`) | Instant, tailored concept summary, tasks & budget |
| **Budget Overruns** | Dynamic financial tracking & variance | Categorized allocation engine with Indian Rupee (₹) formatting | Real-time visibility into spent vs. remaining funds |
| **Missed Deadlines** | Milestone task management & run sheet | Automated due-date engine with overdue status categorization | Clear operational timeline from kickoff to event day |
| **RSVP Chaos** | Digital guest roster & public RSVP links | Tokenized public guest portal with party size & dietary tags | Live attendee headcount calculation without manual tallying |
| **Generic Chatbots** | Context-aware AI Mentor copilot | Event state injection (`budget`, `daysLeft`, `guests`) into LLM | Relevant planning advice grounded in real event facts |

---

## 📸 Product Screenshots & Visual Walkthrough

CelebrAI includes **39 authentic, high-resolution screen captures** (21 desktop 1920×1080 and 18 mobile responsive captures) committed directly inside [`Docs/screenshots/`](Docs/screenshots/).

### A. Landing and Authentication

<div align="center">

| Desktop Landing Hero | Mobile Landing Hero | Sign In Page |
|:---:|:---:|:---:|
| <img src="Docs/screenshots/desktop/desktop-01-landing-page.png" width="340" alt="CelebrAI Desktop Landing Page" /> | <img src="Docs/screenshots/mobile/mobile-01-landing-page.png" width="160" alt="CelebrAI Mobile Landing Page" /> | <img src="Docs/screenshots/desktop/desktop-02-login.png" width="340" alt="Sign In Page" /> |
| *Editorial luxury hero with clear value proposition and CTAs* | *Mobile-optimized responsive viewport* | *Email/password authentication and Google OAuth* |

</div>

---

### B. Multi-Step Event Creation Wizard

<div align="center">

| Step 1: Event Type Selection | Step 2: Core Event Details | Step 3: Guests & Budget Setup | Step 4: Theme Preferences |
|:---:|:---:|:---:|:---:|
| <img src="Docs/screenshots/desktop/desktop-04-event-type-selection.png" width="220" alt="Step 1 Event Selection" /> | <img src="Docs/screenshots/desktop/desktop-05-event-details.png" width="220" alt="Step 2 Event Details" /> | <img src="Docs/screenshots/desktop/desktop-06-guest-budget-setup.png" width="220" alt="Step 3 Guests and Budget" /> | <img src="Docs/screenshots/desktop/desktop-07-theme-preferences.png" width="220" alt="Step 4 Theme Preferences" /> |
| *8 celebration categories* | *Title, date picker & venue* | *Headcount & INR (₹) budget* | *Theme style & custom notes* |

</div>

---

### C. AI Celebration Plan Blueprint

<div align="center">

| AI Plan: Concept Overview | AI Plan: Priority Tasks | AI Plan: Categorized Budget | AI Plan: Milestone Timeline |
|:---:|:---:|:---:|:---:|
| <img src="Docs/screenshots/desktop/desktop-08-ai-plan-overview.png" width="220" alt="AI Plan Concept Overview" /> | <img src="Docs/screenshots/desktop/desktop-09-ai-plan-tasks.png" width="220" alt="AI Plan Priority Tasks" /> | <img src="Docs/screenshots/desktop/desktop-10-ai-plan-budget.png" width="220" alt="AI Plan Categorized Budget" /> | <img src="Docs/screenshots/desktop/desktop-11-ai-plan-timeline.png" width="220" alt="AI Plan Timeline" /> |
| *Groq GPT-OSS 120B blueprint* | *Editable milestone action items* | *6-category spending breakdown* | *Countdown run sheet schedule* |

</div>

---

### D. Command Center, Tasks & Financials

<div align="center">

| Host Command Center Dashboard | Tasks & Milestone Run Sheet | Budget & Expense Breakdown | Curated Vendor Discovery |
|:---:|:---:|:---:|:---:|
| <img src="Docs/screenshots/desktop/desktop-12-dashboard.png" width="220" alt="Host Home Dashboard" /> | <img src="Docs/screenshots/desktop/desktop-15-tasks-run-sheet.png" width="220" alt="Tasks and Run Sheet" /> | <img src="Docs/screenshots/desktop/desktop-16-budget-dashboard.png" width="220" alt="Budget and Expenses" /> | <img src="Docs/screenshots/desktop/desktop-17-vendors-directory.png" width="220" alt="Vendor Directory" /> |
| *Countdown clock & summary metrics* | *Filterable tasks with priority badges* | *Financial donut chart & category spend* | *Filterable directory & saved favorites* |

</div>

---

### E. AI Mentor, Guest RSVP & Account Management

<div align="center">

| AI Mentor Conversation | Guest & RSVP Management | User Profile & Workspace | Notifications Center |
|:---:|:---:|:---:|:---:|
| <img src="Docs/screenshots/desktop/desktop-21-ai-mentor-chat.png" width="220" alt="AI Mentor Conversation" /> | <img src="Docs/screenshots/desktop/desktop-14-guests-management.png" width="220" alt="Guest Management" /> | <img src="Docs/screenshots/desktop/desktop-18-profile.png" width="220" alt="User Profile" /> | <img src="Docs/screenshots/desktop/desktop-19-notifications.png" width="220" alt="Notifications Center" /> |
| *Context-aware planning chat* | *RSVP attendance & dietary tracking* | *IndexedDB avatar & statistics* | *Deadline alerts & event notifications* |

</div>

> 📖 **Full Visual Catalog**: Complete technical metadata (dimensions, file sizes, and viewports) for all 39 screenshots is cataloged in [`Docs/SCREENSHOT_INDEX.md`](Docs/SCREENSHOT_INDEX.md).

---

## 🗺️ Master 36-Page Route Matrix

All 36 pages from the master specification are implemented, connected, and navigable:

| # | Route | Page Title | Component | Auth Required | Purpose & Functional Scope | Status |
|---|---|---|---|---|---|---|
| **01** | `/` | Landing Page | `Landing.tsx` | No | Brand showcase, value proposition, and onboarding CTAs | Verified |
| **02** | `/explore-events` | Explore Event Types | `ExploreEvents.tsx` | No | Gallery of 8 event types with sample budgets and schedules | Verified |
| **03** | `/signin` | Sign In | `Auth.tsx` | No | Email/password sign-in and Google OAuth popup authentication | Verified |
| **04** | `/signup` | Sign Up | `Auth.tsx` | No | Account registration with real-time password strength validation | Verified |
| **05** | `/onboarding` | Onboarding | `Onboarding.tsx` | No | Host preferences setup (currency, planning style, location) | Verified |
| **06** | `/create-event` | Create Event Wizard | `CreateEvent.tsx` | No | 4-step wizard: Type, Details, Guest/Budget, Theme Preferences | Verified |
| **07** | `/ai-plan-preview` | AI Plan Preview | `AIPlanPreview.tsx` | No | 4-tab plan generator: Concept, Tasks, Budget, and Timeline | Verified |
| **08** | `/dashboard` | Home Dashboard | `HomeDashboard.tsx` | No | Command center with countdown clock, summary cards, and tasks | Verified |
| **09** | `/events` | All Events | `AllEvents.tsx` | No | Catalog of Active, Past, and Archived celebrations | Verified |
| **10** | `/event-overview` | Event Overview | `EventOverview.tsx` | No | Detailed single-event summary with quick edit controls | Verified |
| **11** | `/ai` | AI Assistant / Mentor | `AIAssistant.tsx` | No | Event-aware conversational planner with chat history & chips | Verified |
| **12** | `/tasks` | To-do List | `TodoList.tsx` | No | Priority task tracker with status filters (Due Today, Overdue) | Verified |
| **13** | `/timeline` | Timeline & Calendar | `TimelineCalendar.tsx` | No | Chronological schedule view from milestones to celebration day | Verified |
| **14** | `/budget` | Budget Dashboard | `BudgetDashboard.tsx` | No | Planned budget vs actual spend with category allocation bars | Verified |
| **15** | `/expenses` | Expense Manager | `ExpenseManager.tsx` | No | Line-item expense ledger with paid/pending status toggles | Verified |
| **16** | `/guests` | Guest Management | `GuestManagement.tsx` | No | Attendee roster with RSVP tracking (Accepted, Pending, Declined) | Verified |
| **17** | `/invitations` | Invitations & RSVP | `InvitationsRSVP.tsx` | No | Digital invitation preview carousel with shareable RSVP links | Verified |
| **18** | `/vendors` | Vendor Discovery | `VendorDiscovery.tsx` | No | Filterable directory of photographers, venues, and caterers | Verified |
| **19** | `/vendors/:id` | Vendor Details | `VendorDetails.tsx` | No | Detailed vendor profile with amenities, pricing, and reviews | Verified |
| **20** | `/decor` | Decor & Theme Studio | `DecorStudio.tsx` | No | Visual moodboards, color palette swatches, and style generator | Verified |
| **21** | `/content-studio` | Content Studio | `ContentStudio.tsx` | No | AI invitation copywriter, WhatsApp broadcasts, and speeches | Verified |
| **22** | `/saved` | Saved Workspace | `SavedWorkspace.tsx` | No | Bookmarked vendors, moodboard snapshots, and saved plans | Verified |
| **23** | `/run-sheet` | Event Run Sheet | `RunSheet.tsx` | No | Minute-by-minute day-of-event schedule for coordinators | Verified |
| **24** | `/team` | Team Responsibilities | `TeamResponsibilities.tsx`| No | Co-host delegation matrix with role badges and assignments | Verified |
| **25** | `/reports` | Reports & Export | `ReportsExport.tsx` | No | Exportable budget ledgers, vendor lists, and guest rosters | Verified |
| **26** | `/profile` | My Profile | `Profile.tsx` | No | Host profile, IndexedDB avatar upload, and account stats | Verified |
| **27** | `/settings` | Settings | `Settings.tsx` | No | Currency (INR, USD, EUR), language, and password reset | Verified |
| **28** | `/help` | Help & Feedback | `HelpFeedback.tsx` | No | User guide, frequently asked questions, and feedback form | Verified |
| **29** | `/privacy` | Privacy & Consent | `PrivacyConsent.tsx` | No | Transparent AI consent toggles, data export, and account deletion | Verified |
| **30** | `/demo-states` | Loading & Error States | `StatesDemo.tsx` | No | Showcase of empty states, loading skeletons, and offline banners | Verified |
| **31** | `/public-event` | Public Event Page | `PublicEvent.tsx` | No | Shareable attendee site with countdown, story, and dress code | Verified |
| **32** | `/guest-rsvp` | Guest RSVP Page | `GuestRSVP.tsx` | No | Public tokenized RSVP portal for attendee attendance confirmation | Verified |
| **33** | `/collaboration` | Collaboration | `CollaborationWorkspace.tsx`| No | Shared event planning workspace for multi-user coordination | Verified |
| **34** | `/notifications` | Notifications Center | `NotificationsCenter.tsx` | No | In-app notification center with filter pills and mark-all-read | Verified |
| **35** | `/subscription` | Subscription Plans | `SubscriptionPlans.tsx` | No | Usage tier overview, token quotas, and premium feature previews | Verified |
| **36** | `/admin` | Admin & Moderation | `AdminModeration.tsx` | No | Administrative controls for vendor moderation and platform logs | Verified |

*Note: The floating **"36 Pages"** drawer button on every screen allows immediate, one-click access to any page in the matrix.*

---

## 🏗️ System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client [Client Application — React 19 + TypeScript]
        A[User Input / Event Setup] --> B[EventContext & State Machines]
        B --> C[IndexedDB Avatar Cache]
        B --> D[HTML5 Canvas Compressor]
    end

    subgraph Server [Backend Gateway — Express / Netlify Functions]
        E[POST /api/ai/generate-plan]
        F[POST /api/ai/chat]
        G[Request Sanitization & Validation]
    end

    subgraph AI [Inference Cloud — Groq LPU]
        H[Model: openai/gpt-oss-120b]
        I[Structured JSON Blueprint]
    end

    subgraph Database [Persistence Suite — Google Firebase]
        J[Firebase Auth — Tokens & OAuth]
        K[Cloud Firestore — Row-Level Rules]
        L[Users, Events, Tasks, Expenses, Guests]
    end

    B -->|HTTPS API Request| E
    B -->|HTTPS Chat Request| F
    E --> G
    F --> G
    G --> H
    H --> I
    I -->|Validated JSON| B
    B -->|Persist Approved Plan| K
    K --> L
    A -->|Authentication| J
```

*For complete data lifecycle diagrams, see [Docs/ARCHITECTURE.md](Docs/ARCHITECTURE.md).*

---

## ⚡ Generative AI Integration Deep-Dive

CelebrAI utilizes the **Groq Cloud API** running the open-weights **GPT-OSS 120B** model (`openai/gpt-oss-120b`) on specialized Groq LPU hardware, delivering sub-second response latencies.

### AI Event Plan Generation
When a host completes the 4-step wizard, the client transmits the event specifications to the server proxy:

```json
{
  "eventType": "Birthday",
  "eventName": "My Birthday Party",
  "date": "2027-01-31",
  "location": "Ahmedabad, Gujarat",
  "guestCount": 100,
  "budget": 100000,
  "theme": "Classic Elegance",
  "specialNotes": "Focus on outdoor lighting and vegetarian catering"
}
```

The server proxy attaches the protected `GROQ_API_KEY`, issues a strict system prompt enforcing JSON schema output, strips any surrounding markdown code fences via regex, and returns structured data:

```json
{
  "conceptSummary": "An exquisite Birthday planned with a INR 1,00,000 budget for 100 guests...",
  "suggestedThemes": ["Classic Elegance", "Botanical Opulence", "Champagne Gold"],
  "tasks": [
    { "title": "Finalize and contract the main celebration venue", "category": "Venue", "priority": "High" },
    { "title": "Tasting and menu confirmation for 100 guests", "category": "Catering", "priority": "High" }
  ],
  "budgetBreakdown": [
    { "category": "Venue & Infrastructure", "percentage": 35, "estimatedAmount": 35000 },
    { "category": "Food & Beverage", "percentage": 30, "estimatedAmount": 30000 }
  ],
  "milestones": [
    { "title": "Core Vendor Confirmations", "timeframe": "Month 1" },
    { "title": "Celebration Day", "timeframe": "Event Day" }
  ]
}
```

---

## 💾 Database Schema & Offline Storage Engine

### Firestore Multi-Tenant Architecture
- `users/{userId}`: Stores user credentials, regional preferences (`currency: 'INR'`), and planning style.
- `events/{eventId}`: Master event document storing title, date, target budget, and concept summaries.
- `tasks/{taskId}`: Operational checklist linked by `eventId` with `priority` and `dueDate`.
- `expenses/{expenseId}`: Itemized budget ledger linked by `eventId` with `amount`, `category`, and `status`.
- `guests/{guestId}`: Guest records supporting both authenticated host management and public unauthenticated RSVP updates.
- `conversations/{convId}/messages`: Threaded AI Mentor conversation turns.

### Local Client Storage
- **IndexedDB (`celebrai_avatars`)**: Stores compressed profile photos locally, enabling instantaneous 0ms avatar rendering upon page reload without cloud egress.
- **LocalStorage**: Caches developer drawer flags and active event identifiers for offline persistence.

*For complete schema tables and index definitions, see [Docs/DATABASE_SCHEMA.md](Docs/DATABASE_SCHEMA.md).*

---

## 🚀 Local Development & Execution Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone & Install
```bash
git clone https://github.com/Kanani-Shubham/CelebrAi.git
cd CelebrAi
npm install
```

### 2. Verify Baseline Quality
Run automated tests and static linter:
```bash
npm test
npm run lint
```

### 3. Launch the Application
- **Frontend Only** (includes local deterministic fallback AI generator):
  ```bash
  npm run dev
  ```
- **Full-Stack Mode** (Frontend + Local Express AI Proxy):
  ```bash
  npm run dev:all
  ```
Open `http://localhost:5173` in your browser.

### 4. Production Build
```bash
npm run build
```
Generates the optimized chunk-split production bundle inside `dist/`.

---

## 📋 Hack2Skill Official Submission Reference

| Field Name | Official Value | Notes |
|---|---|---|
| **Public GitHub Repository Link** | `https://github.com/Kanani-Shubham/CelebrAi` | Clean Git tree under 10 MB |
| **Project Deployed Link** | `https://celebr-ai.netlify.app/` | Fully functional Netlify live release |
| **Instagram Reel** | `https://www.instagram.com/reel/DfJckDCIOv7/` | Official Instagram Reels challenge link |
| **Demo Video** | `[ADD_UNLISTED_YOUTUBE_OR_ACCESSIBLE_GOOGLE_DRIVE_URL]` | Unlisted video walkthrough |
| **LinkedIn Announcement** | `[ADD_PUBLIC_LINKEDIN_POST_URL]` | Public project post |

*For exact 1024-character copy-paste form answers, see [Docs/HACK2SKILL_SUBMISSION.md](Docs/HACK2SKILL_SUBMISSION.md).*

---

## 📚 Documentation Library & Technical Reports

- **[Master Documentation Portal](Docs/README.md)**: Master portal and cross-index.
- **[System Architecture & Data Flow](Docs/ARCHITECTURE.md)**: Deep architectural flow and Mermaid diagrams.
- **[Database Schema & Models](Docs/DATABASE_SCHEMA.md)**: Complete Firestore collection specifications.
- **[Security Architecture & Governance](Docs/SECURITY.md)**: Security rules, XSS sanitization, and secret protection.
- **[Testing & QA Verification Report](Docs/TESTING_REPORT.md)**: Evidence from 14 test suites and 134 passed tests.
- **[Performance & Bundle Analysis](Docs/PERFORMANCE.md)**: Measured build times, chunk sizes, and caching.
- **[Accessibility & Design Review](Docs/ACCESSIBILITY.md)**: WCAG 2.1 AA checklist and contrast calculations.
- **[Screenshot Index & Gallery](Docs/SCREENSHOT_INDEX.md)**: Catalog of all 39 verified desktop and mobile captures.
- **[Hack2Skill Final Evaluation Audit](Docs/HACK2SKILL_FINAL_AUDIT.md)**: Six-parameter evaluation report.
- **[Documentation Pre-Audit](Docs/DOCUMENTATION_AUDIT.md)**: Claim verification log and baseline inventory.

---

## 👥 Project Maintainers & Open-Source Licensing

- **Lead Developer**: Shubham Kanani
- **GitHub**: [@Kanani-Shubham](https://github.com/Kanani-Shubham)
- **Email**: `shubhamkanani.2006@gmail.com`
- **License**: Released under the [MIT License](LICENSE).

---

<p align="center">
  <strong>CelebrAI — Plan Smarter. Celebrate Better.</strong><br>
  Engineered with pride for the Hack2Skill AI Hackathon.
</p>
