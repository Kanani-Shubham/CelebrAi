# CelebrAI — Technical Documentation Hub

Welcome to the central technical documentation portal for **CelebrAI**. This directory houses in-depth architectural specifications, security governance policies, database schemas, performance audits, accessibility reviews, and test reports.

---

## 📚 Technical Documentation Index

```
Docs/
├── README.md                 # Master Documentation Portal (This File)
├── ARCHITECTURE.md           # System Architecture, Subsystems & Mermaid Diagrams
├── DATABASE_SCHEMA.md        # Firestore Multi-Tenant Schema & IndexedDB Models
├── SECURITY.md               # Security Governance, Firestore Rules & Sanitization
├── TESTING_REPORT.md         # Vitest Verification Suite (14 Suites, 134 Tests)
├── PERFORMANCE.md            # Measured Production Build & Bundle Performance
├── ACCESSIBILITY.md          # WCAG 2.1 AA Compliance, Color Contrast & a11y Audit
├── SCREENSHOT_INDEX.md       # Verified Visual Catalog (39 Authentic Captures)
├── HACK2SKILL_SUBMISSION.md  # Official Challenge Submission Data & Copy-Paste Text
├── HACK2SKILL_FINAL_AUDIT.md # Comprehensive 6-Factor Evaluator Final Report
├── DOCUMENTATION_AUDIT.md    # Pre-Audit Claim Verification & Inventory
├── IMPLEMENTATION_AUDIT.md   # Greenfield to 36-Page Verification Audit
└── IMPLEMENTATION_REPORT.md  # Detailed Specification & Feature Matrix
```

---

## 📑 Core Documentation Summaries

### 1. [System Architecture & Data Flow](ARCHITECTURE.md)
Comprehensive breakdown of CelebrAI's decoupled full-stack architecture. Details client-side React 19 state machines, serverless Netlify and Express AI gateways, Cloud Firestore persistence layers, and end-to-end data lifecycles illustrated with Mermaid sequence and state diagrams.

### 2. [Database Schema & Local Storage](DATABASE_SCHEMA.md)
Exhaustive specification of Cloud Firestore collections (`users`, `events`, `tasks`, `expenses`, `guests`, `conversations`, `notifications`) including document identifiers, field types, composite indexes, row-level ownership constraints, and the IndexedDB client avatar storage engine.

### 3. [Application Security & Credential Governance](SECURITY.md)
Detailed security review covering zero client-side secret exposure, isolated server-side Groq API proxies, multi-tenant row-level Firestore rules, public RSVP write-only permissions, multi-pass XSS input sanitization, safe Markdown rendering, and GDPR-aligned data privacy controls.

### 4. [Testing & Quality Verification Suite](TESTING_REPORT.md)
Detailed verification evidence from the **14 automated Vitest test suites** running **134 unit and integration tests** with a 100% pass rate. Includes commands for reproduction, mock strategies, and coverage breakdowns across business logic, security, and user journeys.

### 5. [Performance & Bundle Analysis](PERFORMANCE.md)
Empirical metrics from the Vite production build (`757ms` build time). Analyzes chunk splitting across `vendor-firebase` (181 kB gzip), `vendor-react` (114 kB gzip), and `vendor-icons` (11 kB gzip), plus client-side Canvas image compression and query listener cleanup.

### 6. [Accessibility & Design System](ACCESSIBILITY.md)
Audit of CelebrAI's editorial luxury aesthetic against WCAG 2.1 AA standards. Highlights the **14.8:1 contrast ratio** achieved between Tuxedo Black (`#171F20`) and Soft Satin (`#F7F1E8`), full keyboard navigation workflows, and semantic ARIA labeling.

### 7. [Screenshot Index & Visual Gallery](SCREENSHOT_INDEX.md)
Catalog indexing all **39 verified screen captures** (21 high-resolution desktop 1920×1080 and 18 mobile responsive captures), complete with filenames, pixel dimensions, file sizes, and functional screen descriptions.

### 8. [Hack2Skill Official Submission Reference](HACK2SKILL_SUBMISSION.md)
Curated submission guide with exact repository links, deployed Netlify URLs, Instagram Reel links, demo video placeholders, and pre-formatted 1024-character text responses for the Challenge 5 submission form.

### 9. [Hack2Skill Final Evaluation Audit](HACK2SKILL_FINAL_AUDIT.md)
Comprehensive executive report scoring CelebrAI across the six official Hack2Skill evaluation factors (Code Quality, Security, Efficiency, Testing, Accessibility, Problem Statement Alignment) with direct evidence citations and verified execution results.

---

## ⚡ Quick Links
- **Public GitHub Repository**: [https://github.com/Kanani-Shubham/CelebrAi](https://github.com/Kanani-Shubham/CelebrAi)
- **Live Deployed Application**: [https://celebr-ai.netlify.app/](https://celebr-ai.netlify.app/)
- **Instagram Reel**: [https://www.instagram.com/reel/DfJckDCIOv7/](https://www.instagram.com/reel/DfJckDCIOv7/)
- **Lead Developer**: Shubham Kanani (`shubhamkanani.2006@gmail.com`)
