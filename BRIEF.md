# CelebrAI — Executive Project Brief & Architecture Overview

> **Production Application:** [https://celebr-ai.netlify.app](https://celebr-ai.netlify.app)  
> **Repository:** Full-stack React + TypeScript + Firebase + Groq AI Event Planning Platform

---

## 1. Executive Summary

**CelebrAI** is a luxury, AI-powered celebration and event planning platform designed to transform chaotic event coordination into an elegant, stress-free experience. 

From intimate weddings and milestone anniversaries to large corporate galas, festivals, and birthdays, CelebrAI serves as a full-cycle digital concierge. It combines real-time database synchronization with an advanced AI mentor to generate schedules, manage budgets, track guest RSVPs, recommend vendors, and draft digital invitations.

---

## 2. The Problem CelebrAI Solves

Event planning traditionally suffers from extreme fragmentation:
- **Scattered Tools:** Budgets are kept in spreadsheets, checklists in note apps, guest responses in WhatsApp messages, and vendor contracts in email threads.
- **Decision Fatigue:** Hosts struggle to estimate realistic budgets, schedules, and caterer ratios for their specific guest size.
- **RSVP Chaos:** Manually tracking plus-ones, meal preferences, and arrival statuses often leads to inaccurate headcount estimates and venue overspending.
- **Generic AI Advice:** Standard chatbots produce generic answers that lack context, hallucinate pricing, or fail to connect directly to the user's saved event data.

**CelebrAI unifies all of this under a single, editorial interface powered by persistent data and context-aware AI.**

---

## 3. Core Features & Capabilities

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CELEBRAI                                  │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│    AI Mentor     │  Guest & RSVP    │  Budget & Tasks  │    Creative   │
│   (Groq / LLM)   │    Ecosystem     │    Management    │    Studios    │
├──────────────────┼──────────────────┼──────────────────┼───────────────┤
│ • Timelines      │ • Public Links   │ • Category Splits│ • Moodboards  │
│ • Vendor Prompts │ • Headcount Calc │ • Paid vs Due    │ • WhatsApp Copy│
│ • Custom Budgets │ • Dietary Tags   │ • Deadlines & Run│ • Digital RSVP│
│ • Context-Aware  │ • RSVP Stats     │   Sheets         │   Invitations │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
```

### 1. Intelligent AI Mentor (`/ai`)
- **Model:** Groq-accelerated **GPT-OSS 120B** for near-instant inference.
- **Context-Aware:** Reads confirmed details from the user's active celebration (name, date, guest count, budget, venue) without fabricating information or assuming defaults.
- **New Chat & Firestore Chat History:**
  - Dedicated **New Chat (`+`)** button to start fresh conversations without overwriting earlier work.
  - Dedicated **Chat History (clock/history icon)** slide-out drawer categorizing past discussions into *Today*, *Yesterday*, *Previous 7 Days*, and *Older*.
  - Full Firestore persistence under `conversations/{id}` and `conversations/{id}/messages/{id}` with delete capabilities.
- **Safe Markdown & Mobile-Optimized Typography:** Renders clean typography, headers, bold highlights, bullet lists, and responsive, horizontally scrollable budget tables on mobile screens. Strict system prompts prevent unwanted code blocks.
- **Quick Actions:** Single-click execution for:
  - *Recommend Caterers & Cuisines*
  - *Suggest Decor & Color Palettes*
  - *Create Hour-by-Hour Timeline*
  - *Optimize Spending & Budget Allocations*
  - *Draft Multi-Channel Invitations*
  - *Optimize Spending & Budget Allocations*
  - *Draft Multi-Channel Invitations*
- **Persisted Chats:** Chat histories are saved in Firestore under each event and user, allowing seamless continuation across sessions.

### 2. Multi-Event Management & Onboarding (`/events`, `/create-event`)
- **Event Types:** Dedicated workflows for Weddings, Birthdays, Anniversaries, Corporate Events, Festivals, College Gatherings, and Custom Celebrations.
- **Step Validation:** Enforces clean required fields (event title, valid date) while keeping preferences optional.
- **Active Event Switching:** Switch between multiple planned celebrations instantly from the global navigation header.

### 3. Guest & RSVP System (`/guests`, `/invitations`, `/guest-rsvp`)
- **Real-Time Headcounts:** Live calculations for Attending, Pending, and Declined parties with automatic plus-one summation.
- **Public RSVP Portal (`/guest-rsvp?eventId=...`):** Shareable link allowing invitees to confirm attendance, add accompanying guests, submit dietary preferences, and leave notes.
- **Security-First Firestore Queries:** Scoped strictly to the event owner's authenticated UID, eliminating permission leaks.

### 4. Smart Budget & Expense Manager (`/budget`, `/expenses`)
- **Summary Metric Cards:** Dedicated cards for **Paid** (`#EAF7F1`), **Pending** (`#FFF4D5`), and **Remaining** / **Over Budget** (`#FFFFFF` / `#FEE2E2`) calculated dynamically from real Firestore records.
- **Individual Expense Cards:** Replaces raw lists with structured white cards featuring category-themed soft badge icons, clear vendor and allocation subtitles, prominent currency amounts, and compact status pills.
- **Inline Operations & Filtering:** Segmented filters (*All*, *Paid*, *Pending*, *Overdue*), modal-based Add/Edit workflows, and three-dot contextual action menus with deletion confirmation.
- **Category Allocations & Variance:** Tracks planned limits vs. actual spend across Venue, Catering, Decor, Photography, Attire, and Entertainment with native Indian Rupee (`₹`) formatting.

### 5. Task Manager & Interactive Calendar (`/tasks`, `/timeline`, `/run-sheet`)
- **Milestone Deadlines:** Tracks overdue, in-progress, and completed tasks categorized by urgency.
- **Visual Month Calendar:** Displays color-coded task markers, upcoming deadlines, and event day countdowns.
- **Day-of Run Sheet:** Hour-by-hour operational timeline for vendors, bridal party, and hosts.

### 6. Creative Studios (`/decor`, `/content-studio`)
- **Decor & Moodboard Studio:** Visual inspiration palettes and theme presets (e.g., *Royal Heritage*, *Minimalist Pastel*, *Bohemian Garden*).
- **Content Studio:** AI copywriter generating bespoke WhatsApp invites, formal email announcements, dinner toasts, and social media captions.

### 7. My Profile & Account Settings (`/profile`, `/settings`)
- **Avatar Photo Upload (Zero-Cost Local Persistence):** Real image upload with client-side canvas compression/resizing (WebP/JPEG $\le 512 \times 512$ under 300 KB) and local persistence in IndexedDB (`celebrai-local-cache`). Completely avoids paid Firebase Storage quota limits on Spark plans while persisting across sessions.
- **Security & Preferences:** Password reset requests, email verification badges, currency toggles, and notification preferences saved to Firestore.

---

## 4. Technology Stack & Architecture

| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend Framework** | **React 19** + **TypeScript** | Strict type safety, modern hooks, and component modularity |
| **Build & Bundler** | **Vite 8** | Lightning-fast HMR and optimized production client chunking |
| **Routing** | **React Router 7** | Full 36-page client-side SPA routing with protected route guards |
| **Icons & UI** | **Lucide React** + Custom CSS Tokens | Minimalist, elegant iconography |
| **Authentication** | **Firebase Auth** | Email/password, session tokens, and profile synchronization |
| **Database** | **Cloud Firestore** | Real-time NoSQL database with owner-isolated security rules |
| **Local Offline Storage** | **IndexedDB** (`idb-keyval` / custom cache) | Resilient client-side avatar storage and offline asset caching |
| **AI Integration** | **Groq SDK** + **GPT-OSS 120B** | Ultra-low latency LLM inference via secure server endpoints |
| **Backend Services** | **Node.js Express** (local) / **Netlify Functions** (prod) | Zero frontend exposure of secret API keys |
| **Hosting & CI/CD** | **Netlify** | Continuous deployment, SSL, and serverless edge functions |

---

## 5. Visual Design System

CelebrAI uses an editorial aesthetic inspired by luxury wedding invitations and architectural magazines:

- **Soft Satin (`#F7F1E8`):** Gentle, warm canvas background that reduces eye strain.
- **Bridal White (`#FFFFFF`):** Crisp surface color for cards, panels, and modals.
- **Morning Fog (`#ECE6DE`):** Subtle hairline borders, dividers, and neutral chips.
- **Violet Accent (`#D8CBF1`):** Gentle pastel purple for selected states, active tags, and AI badges.
- **Tuxedo Black (`#171F20`):** High-contrast typography, primary buttons, and headings.
- **Blackened Oak (`#272E2E`):** Secondary cards and dark interactive elements.
- **Typography:**
  - *Headings:* **Playfair Display** (classic high-fashion serif)
  - *Interface & Body:* **DM Sans** (clean, geometric, highly legible sans-serif)
- **Responsive Layout:** Adaptive desktop navigation bar with dropdown menus alongside a mobile bottom navigation dock.

---

## 6. Security & Data Ownership

- **Per-User Isolation:** Every event, task, guest, and budget record is strictly tagged with `ownerId` and `createdBy` matching `request.auth.uid`.
- **Firestore Security Rules:** Non-authenticated or cross-account reads and writes are blocked at the database engine level.
- **Storage Rules:** Uploads are limited to the user's own path (`/avatars/{userId}/*`) and restricted to image MIME types under 5 MB.
- **Protected Secrets:** The `GROQ_API_KEY` is stored strictly in serverless environment variables and is never exposed in client bundles.

---

## 7. Project Structure

```
CelebrAI/
├── netlify/
│   └── functions/
│       └── api.js              # Serverless Groq AI handler for production
├── server/
│   └── api.js                  # Local Express server for AI proxying
├── src/
│   ├── components/             # Reusable UI cards, headers, modal dialogues
│   ├── contexts/               # AuthContext, EventContext, NotificationContext
│   ├── data/                   # Mock templates and fallback catalogs
│   ├── pages/
│   │   ├── advanced/           # PublicEvent, GuestRSVP, Collaboration
│   │   ├── dashboard/          # HomeDashboard, AIAssistant, AllEvents
│   │   ├── onboarding/         # CreateEvent, AIPlanPreview, Auth
│   │   ├── planning/           # Guests, Tasks, Timeline, Budget, Vendors
│   │   └── workspace/          # Profile, Settings, Reports, RunSheet
│   ├── services/
│   │   ├── ai/                 # Groq client configuration
│   │   └── firebase/           # Auth, Firestore CRUD, Storage upload
│   ├── utils/                  # Date formatters, timezones, currency helpers
│   ├── App.tsx                 # Root router with 36 connected routes
│   └── index.css               # Global theme tokens, typography, and responsive grid
├── firestore.rules             # Production database security rules
├── storage.rules               # Production cloud storage security rules
├── firebase.json               # Firebase deployment and rewrites configuration
└── package.json                # Project dependencies and build scripts
```

---

## 8. Quickstart Guide (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd CelebrAI
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=celebrai-62487
VITE_FIREBASE_STORAGE_BUCKET=celebrai-62487.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
GROQ_API_KEY=your_groq_api_key
```

### 3. Run Development Server
```bash
# Start frontend client (Vite)
npm run dev

# Start local AI proxy server (optional when testing AI locally)
npm run server
```

### 4. Build for Production
```bash
npm run build
```

---

## 9. Summary

CelebrAI bridges the gap between raw AI potential and practical event organization. It delivers an intuitive, full-featured workspace that empowers anyone—from first-time party hosts to professional wedding planners—to plan memorable celebrations with confidence.

