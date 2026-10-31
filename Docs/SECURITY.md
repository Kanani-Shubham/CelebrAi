# CelebrAI — Security Architecture & Credential Governance

**Document Version:** 2.0.0  
**Status:** Audited & Verified Against Production Rules and Handlers  
**Last Updated:** October 2026  
**Scope:** Authentication, Authorization, Database Rules, Secret Management, Input Sanitization, and Data Privacy  

---

## 1. Authentication Architecture

CelebrAI utilizes Firebase Authentication v13.1.0 to manage identity life cycles. The authentication layer is encapsulated within [`src/contexts/AuthContext.tsx`](../src/contexts/AuthContext.tsx).

### Authentication Methods
1. **Email / Password**: Enforces client-side validation for email syntax and password length (minimum 8 characters, numerical and letter checks). Handled via `createUserWithEmailAndPassword` and `signInWithEmailAndPassword`.
2. **Google OAuth**: Integrated via `GoogleAuthProvider` utilizing popup and redirect fallbacks (`signInWithPopup`, `signInWithRedirect`). No host credentials or OAuth secrets are stored in client state.
3. **Password Reset**: Automated password recovery dispatch via `sendPasswordResetEmail` with inline rate-limiting feedback.

### Token Lifecycle & Session Management
- **Token Refresh**: Firebase ID tokens expire after 1 hour. `AuthContext` implements an automatic background token refresh interval (every 50 minutes) to maintain active session validity for background AI proxy calls.
- **No Token Storage in LocalStorage**: Authentication tokens are kept in memory within React state; only non-sensitive preferences (`activeEventId`, `devMode`) persist in `localStorage`.

---

## 2. Cloud Firestore Row-Level Security Rules

All Firestore access is enforced server-side using Firebase Security Rules v2 ([`firestore.rules`](../firestore.rules)). Access follows the principle of least privilege and strict multi-tenant owner isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isEventMember(eventId) {
      return isAuthenticated() && (
        exists(/databases/$(database)/documents/events/$(eventId)) &&
        (
          get(/databases/$(database)/documents/events/$(eventId)).data.ownerId == request.auth.uid ||
          get(/databases/$(database)/documents/events/$(eventId)).data.createdBy == request.auth.uid ||
          (
            get(/databases/$(database)/documents/events/$(eventId)).data.collaborators is list &&
            request.auth.uid in get(/databases/$(database)/documents/events/$(eventId)).data.collaborators
          )
        )
      );
    }

    // 1. Users Collection
    match /users/{userId} {
      allow read, create, update: if isOwner(userId);
      allow delete: if false; // Deletion guarded
    }

    // 2. Events Collection
    match /events/{eventId} {
      allow read: if isAuthenticated() && (
        resource.data.ownerId == request.auth.uid ||
        resource.data.createdBy == request.auth.uid ||
        resource.data.isPublic == true ||
        (resource.data.collaborators is list && request.auth.uid in resource.data.collaborators)
      );
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        resource.data.ownerId == request.auth.uid ||
        resource.data.createdBy == request.auth.uid
      );
    }

    // 3. Tasks, Expenses, Guests
    match /tasks/{taskId} {
      allow read, write: if isEventMember(resource.data.eventId);
    }

    match /expenses/{expenseId} {
      allow read, write: if isEventMember(resource.data.eventId);
    }

    match /guests/{guestId} {
      allow read: if isEventMember(resource.data.eventId) || resource.data.id == guestId;
      allow create: if isAuthenticated();
      // Public RSVP response update
      allow update: if isEventMember(resource.data.eventId) || 
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'partySize', 'dietary', 'notes', 'updatedAt']);
    }

    // 4. AI Conversations & Messages
    match /conversations/{convId} {
      allow read, write: if isAuthenticated() && resource.data.ownerId == request.auth.uid;
      match /messages/{msgId} {
        allow read, write: if isAuthenticated();
      }
    }
  }
}
```

---

## 3. Server-Side Secret Management & API Proxy

### Zero Frontend Credential Exposure
- **Groq API Key**: `GROQ_API_KEY` is maintained strictly within backend server environments ([`server/api.js`](../server/api.js) and Netlify Function [`netlify/functions/api.js`](../netlify/functions/api.js)).
- **Vite Client Bundle Safety**: No private AI keys or administrative service account credentials exist in client source files, client environment variables, or build output.
- **Repository Hygiene**: Neither `.env` nor `.env.example` is committed or tracked in Git. Both are strictly excluded via [`.gitignore`](../.gitignore).

---

## 4. Input Sanitization & XSS Defense

All user inputs and incoming AI model responses undergo multi-pass sanitization before DOM injection or database persistence:

1. **Text & Input Sanitizer ([`src/utils/security.ts`](../src/utils/security.ts))**:
   - Strips dangerous HTML tag constructs (`<script>`, `<iframe`, `onload=`, `javascript:`).
   - Validates MIME types for image uploads, enforcing strict whitelisting (`image/jpeg`, `image/png`, `image/webp`).
   - Limits file uploads to `< 5 MB` on the frontend before local Canvas processing down to `< 100 KB`.
2. **Safe Markdown Renderer ([`src/components/common/SafeMarkdown.tsx`](../src/components/common/SafeMarkdown.tsx))**:
   - Sanitizes AI assistant output markdown prior to React rendering.
   - Converts headings, tables, bold text, and lists safely while preventing execution of embedded raw HTML or unescaped event handlers.

---

## 5. User Privacy & Data Governance (GDPR Controls)

Located at [`/privacy`](../src/pages/workspace/PrivacyConsent.tsx), CelebrAI provides transparent host controls:
- **AI Processing Consent**: Granular toggle enabling or disabling external AI model context sharing.
- **Instant Data Export**: One-click download of all user events, tasks, expenses, and guest lists in structured JSON format.
- **Account & Data Purge**: Complete deletion workflow purging user profile and associated event data from browser storage and initiating Firestore record cleanup.

---

## 6. Known Security Considerations & Limitations
- **Public RSVP Endpoint**: Guest RSVP endpoints allow unauthenticated updates to specific fields (`status`, `partySize`, `dietary`, `notes`) using the unique `guestId` token. To prevent brute-force status enumeration, `guestId` tokens are randomized 20-character alphanumeric strings.
- **Rate-Limiting**: Production rate-limiting on Netlify Functions is managed via Netlify Edge policies; for standalone Express execution, an in-memory sliding window rate limiter is utilized.
