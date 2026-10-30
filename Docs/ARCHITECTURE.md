# System Architecture — CelebrAI

> [!NOTE]
> CelebrAI is a React SPA with a lightweight Express/Netlify Functions proxy for AI calls and Firebase for all persistence, authentication, and file storage.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          User's Browser                                 │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                   React SPA (Vite Build)                     │     │
│   │                                                              │     │
│   │  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │     │
│   │  │AuthContext│  │ EventContext  │  │   React Router DOM   │   │     │
│   │  └──────────┘  └──────────────┘  └──────────────────────┘   │     │
│   │                                                              │     │
│   │  ┌──────────────────────┐   ┌─────────────────────────────┐ │     │
│   │  │  src/services/ai/    │   │  src/services/firebase/     │ │     │
│   │  │  groq.ts (client)    │   │  firestore.ts / auth.ts     │ │     │
│   │  └──────────┬───────────┘   └──────────┬──────────────────┘ │     │
│   └─────────────│──────────────────────────│────────────────────┘     │
└─────────────────│──────────────────────────│──────────────────────────┘
                  │                          │
                  │ HTTPS POST               │ HTTPS (Firebase SDK)
                  │ /api/ai/*                │
                  ▼                          │
┌─────────────────────────────┐             │
│   Netlify Functions /        │             │
│   Express (server/api.js)    │             │
│                              │             │
│  • Verifies Firebase ID Token│             │
│  • Attaches GROQ_API_KEY     │             │
│  • Rate limiting (planned)   │             │
│  • Returns JSON response     │             │
└──────────────┬───────────────┘             │
               │                            │
               │ HTTPS                       │
               ▼                            ▼
┌──────────────────────┐       ┌─────────────────────────────────────┐
│     Groq AI API      │       │          Google Firebase             │
│                      │       │                                     │
│  Primary Model:      │       │  ┌────────────────────────────┐    │
│  llama-4-scout-17b   │       │  │    Firebase Authentication  │    │
│                      │       │  │  Email/Password + Google    │    │
│  Fallback Model:     │       │  └────────────────────────────┘    │
│  llama-3.3-70b       │       │                                     │
│  -versatile          │       │  ┌────────────────────────────┐    │
│                      │       │  │      Cloud Firestore        │    │
│  Endpoints used:     │       │  │  users/ events/ tasks/     │    │
│  /chat/completions   │       │  │  guests/ expenses/ convs/  │    │
│  (JSON mode)         │       │  └────────────────────────────┘    │
└──────────────────────┘       │                                     │
                               │  ┌────────────────────────────┐    │
                               │  │     Firebase Storage        │    │
                               │  │   avatars/{uid}/{file}     │    │
                               │  └────────────────────────────┘    │
                               └─────────────────────────────────────┘
```

---

## 2. Component Architecture

```
src/
├── main.tsx                  # App entry, BrowserRouter
├── App.tsx                   # Route definitions
│
├── contexts/
│   ├── AuthContext.tsx        # Firebase Auth state, ID token, profile
│   └── EventContext.tsx       # Event list, active event, CRUD
│
├── pages/
│   ├── Landing.tsx            # Marketing / unauthenticated home
│   ├── Login.tsx              # Sign in / Sign up
│   ├── Dashboard.tsx          # Event overview grid
│   ├── EventPlanner.tsx       # AI plan generation wizard
│   ├── BudgetTracker.tsx      # Budget vs actual tracking
│   ├── GuestManager.tsx       # RSVP management
│   ├── TaskManager.tsx        # Task checklist
│   ├── AIMentor.tsx           # Chat interface
│   ├── VendorMarketplace.tsx  # Vendor discovery
│   └── Settings.tsx           # Profile settings
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── ui/
│   │   ├── EventCard.tsx
│   │   ├── BudgetChart.tsx
│   │   └── ...
│   └── modals/
│       ├── CreateEventModal.tsx
│       └── ...
│
├── services/
│   ├── ai/
│   │   └── groq.ts            # AI API client (fetch wrapper)
│   └── firebase/
│       ├── config.ts          # Firebase app initialization
│       ├── auth.ts            # Auth helpers
│       └── firestore.ts       # Firestore CRUD helpers
│
├── utils/
│   ├── dateUtils.ts           # Timezone-safe date parsing
│   └── security.ts            # XSS sanitization
│
├── types/
│   └── index.ts               # Central TypeScript interfaces
│
└── data/
    └── mockData.ts            # Static seed data & shared interfaces
```

---

## 3. Data Flow

### 3.1 Authentication Flow

```
User submits credentials
        │
        ▼
Firebase Auth SDK (browser)
        │ Returns User + ID Token
        ▼
AuthContext.setUser() + setIdToken()
        │
        ▼
getUserProfile(uid) → Firestore users/{uid}
        │
        ▼
AuthContext.setProfile()
        │
        ▼
Protected routes render
```

### 3.2 AI Plan Generation Flow

```
User fills EventPlanner form
        │
        ▼
generateEventPlan(request, idToken)
        │
        ▼ POST /api/ai/generate-plan
        │   Authorization: Bearer <idToken>
Netlify Function / Express
        │ Verifies token with Firebase Admin SDK
        │ Calls Groq API with GROQ_API_KEY
        ▼
Groq returns JSON plan
        │
        ▼
validateAIPlan(raw) → AIPlanResult
        │
        ▼
User reviews & approves plan
        │
        ▼
saveApprovedEventPlan(userId, eventData, plan)
        │  Atomic Firestore batch write:
        │  • events/{id} (merge)
        │  • tasks/{id} × N
        │  • expenses/{id} × N
        ▼
EventContext.refresh() → UI updates
```

### 3.3 Real-Time Local Cache

Firestore calls succeed or fall back to `localStorage`:
```
loadEvents() → Firestore getUserEvents(uid)
    ├── SUCCESS → setEvents(data); cache to localStorage
    └── FAILURE → load from localStorage (offline resilience)
```

---

## 4. Deployment Architecture

```
GitHub Repository
      │
      │  Push to main
      ▼
Netlify CI/CD
      │
      ├── npm run build  (tsc + vite build)
      │       │
      │       ▼
      │   dist/          (React SPA static files)
      │
      ├── Netlify CDN    (serves dist/)
      │
      └── Netlify Functions
              │  server/api.js compiled as serverless function
              │  Environment: GROQ_API_KEY, FIREBASE_SERVICE_ACCOUNT
              ▼
          Groq AI API + Firebase Admin SDK
```

### Environment Variables

| Variable | Environment | Required |
|----------|------------|---------|
| `GROQ_API_KEY` | Netlify Functions | ✅ |
| `VITE_FIREBASE_API_KEY` | Build (Vite) | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Build (Vite) | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | Build (Vite) | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Build (Vite) | ✅ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Build (Vite) | ✅ |
| `VITE_FIREBASE_APP_ID` | Build (Vite) | ✅ |
| `VITE_API_URL` | Build (Vite) | Production only |
| `ALLOWED_ORIGIN` | Server | Production only |

---

## 5. Security Boundary Summary

| Layer | Mechanism |
|-------|-----------|
| UI Routes | `useAuth()` → redirect to `/login` |
| API Proxy | Firebase ID Token verification |
| Firestore Data | Server-side security rules (`ownerId == request.auth.uid`) |
| Storage Files | Storage rules (owner write, authenticated read) |
| Secret Keys | Server-only environment variables |
| User Input | `sanitizeText()` before any write |
| File Uploads | MIME + size validation before upload |
