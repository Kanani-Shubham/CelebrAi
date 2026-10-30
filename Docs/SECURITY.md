# Security Documentation — CelebrAI

> [!IMPORTANT]
> This document is the authoritative reference for all security controls in CelebrAI. Review it before making changes to authentication, data access, or input handling.

---

## 1. Firebase Authentication Guard

Every protected route is gated by the `AuthContext`. The `useAuth()` hook exposes `user` (a Firebase `User` object) and `loading`. Components check `if (!user)` to redirect to `/login`.

### Token Lifecycle
- Firebase ID tokens expire after **1 hour**.
- `AuthContext` refreshes the token every **50 minutes** via `setInterval`.
- The refreshed token is stored in React state (`idToken`) and passed in the `Authorization: Bearer <token>` header for all AI API calls.
- Tokens are **never** stored in `localStorage`.

### Sign-in Methods
| Method | Provider | Notes |
|--------|----------|-------|
| Email/Password | Firebase Auth | Password strength enforced by Firebase |
| Google OAuth | `GoogleAuthProvider` | Popup flow, no password stored |

---

## 2. Firestore Security Rules

Firestore access is governed by server-side security rules. The principle is **owner isolation**: users can only read and write documents that belong to them.

### Rule Summary

```
// Pseudocode — see firestore.rules for the full rule set
match /users/{uid} {
  allow read, write: if request.auth.uid == uid;
}

match /events/{eventId} {
  allow read, write: if request.auth.uid == resource.data.ownerId;
  allow create: if request.auth.uid == request.resource.data.ownerId;

  match /guests/{guestId} {
    allow read, write: if request.auth.uid ==
      get(/databases/$(database)/documents/events/$(eventId)).data.ownerId;
  }
  match /tasks/{taskId} {
    allow read, write: if request.auth.uid ==
      get(/databases/$(database)/documents/events/$(eventId)).data.ownerId;
  }
  match /expenses/{expenseId} {
    allow read, write: if request.auth.uid ==
      get(/databases/$(database)/documents/events/$(eventId)).data.ownerId;
  }
}

match /conversations/{conversationId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}
```

### Key Points
- The `ownerId` field is **set server-side** (or set by the authenticated user during creation) and cannot be overwritten by a client.
- All list queries include `where('ownerId', '==', uid)` so even if rules were mis-configured, queries would return empty results for other users.
- `archived`, `isPublic`, and `collaborators` are additional fields but the core access check is always `ownerId`.

---

## 3. Firebase Storage Rules

User avatars and event cover images are stored under path:

```
avatars/{uid}/{filename}
```

### Storage Rule
```
match /avatars/{uid}/{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == uid
    && request.resource.size < 5 * 1024 * 1024       // max 5 MB
    && request.resource.contentType.matches('image/.*');
}
```

- **Read**: Any authenticated user (for profile photo display).
- **Write**: Only the file owner, under 5 MB, image MIME only.

---

## 4. Server-Side Secret Management

### `GROQ_API_KEY`
- Stored as an **environment variable** on the server (Express / Netlify Functions).
- **Never** referenced in any client-side file or Vite config.
- Not committed to the repository (`.env` is in `.gitignore`).
- The frontend calls `/api/ai/*` endpoints; the proxy attaches the key before forwarding to Groq.

### Firebase Config
- `VITE_FIREBASE_*` variables are public client SDK identifiers — they are safe to expose.
- Actual data security is enforced by Firestore rules, not by hiding these keys.

### Environment Variables Reference
| Variable | Where Used | Secret? |
|----------|-----------|---------|
| `GROQ_API_KEY` | `server/api.js` / Netlify Functions | ✅ Yes |
| `VITE_FIREBASE_API_KEY` | Client SDK | ❌ Public |
| `VITE_FIREBASE_PROJECT_ID` | Client SDK | ❌ Public |
| `VITE_API_URL` | Points to proxy base URL | ❌ Public |

---

## 5. XSS Input Sanitization

All user-provided free-text is sanitized before Firestore writes using `src/utils/security.ts`.

### `sanitizeText(input, maxLength?)`
Removes:
- `<script>...</script>` blocks (including multiline)
- `javascript:` URL schemes
- Inline event handlers (`onclick="..."`, `onload='...'`, etc.)
- All remaining HTML tags

Applies a hard `maxLength` cap (default **2 000 characters**) to prevent oversized payloads.

### Where Sanitization Is Applied

| Field | Function |
|-------|----------|
| Event name, location, requirements | `sanitizeText` |
| Guest name, notes | `sanitizeText` |
| Expense title, notes | `sanitizeText` |
| Phone number | `sanitizePhone` |
| Email address | `sanitizeEmail` |

### React Output
React escapes all JSX `{}` expressions by default, preventing secondary injection.

> [!WARNING]
> Never use `dangerouslySetInnerHTML` with user-supplied content. If rich text display is ever needed, pipe through a dedicated HTML sanitizer (e.g., `DOMPurify`) first.

---

## 6. File Upload Validation

File uploads are validated client-side using `src/utils/security.ts` **before** the upload request is sent to Firebase Storage.

```typescript
// Validate before upload
if (!isAllowedImageType(file.type)) {
  throw new Error('Only JPEG, PNG, and WebP images are allowed.');
}
if (!isWithinSizeLimit(file.size)) {
  throw new Error('File must be under 5 MB.');
}
```

### Allowed MIME Types
- `image/jpeg`
- `image/png`
- `image/webp`

Firebase Storage rules enforce the same constraints server-side as a second layer of defense.

---

## 7. CORS Configuration

The Express AI proxy server (`server/api.js`) restricts cross-origin requests.

```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
```

- In production, `ALLOWED_ORIGIN` is set to the Netlify deployment URL.
- Only `POST` is allowed (AI endpoints do not expose `GET`/`PUT`/`DELETE`).
- The `Authorization` header carries the Firebase ID token, which the proxy verifies.

---

## 8. Additional Hardening Recommendations

> [!TIP]
> Apply these measures before production launch:

1. **Rate limiting** — Add `express-rate-limit` on `/api/ai/*` to prevent abuse.
2. **Input validation schema** — Use `zod` to validate request body shapes at the proxy level.
3. **Content Security Policy** — Add a strict CSP header via `netlify.toml` or middleware.
4. **Firestore rules tests** — Run `firebase emulators:exec` with `@firebase/rules-unit-testing` in CI.
5. **Secret rotation** — Rotate `GROQ_API_KEY` every 90 days and update CI/CD secrets.
6. **Audit logging** — Enable Firebase Cloud Audit Logs for Firestore write operations.
