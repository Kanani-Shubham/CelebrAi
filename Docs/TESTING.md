# Testing Documentation — CelebrAI

> [!NOTE]
> CelebrAI uses [Vitest](https://vitest.dev/) as the test runner. Tests are co-located in `src/__tests__/` and cover pure business logic, security utilities, and date/time helpers.

---

## 1. Test Setup

### Framework
| Tool | Version | Purpose |
|------|---------|---------|
| [Vitest](https://vitest.dev/) | `^2.1.0` | Unit test runner (Vite-native) |

Vitest is configured via `vite.config.ts` (inherits the same plugins). No additional configuration file is required for the current test suite — all tests are pure TypeScript without DOM dependencies.

### Running Tests

```bash
# Run all tests once (CI mode)
npm run test

# Watch mode during development (interactive)
npx vitest

# With coverage report
npx vitest run --coverage
```

---

## 2. Test Files

### `src/__tests__/budgetCalculations.test.ts`
Tests pure budget arithmetic functions in isolation — no Firebase, no React.

| Test Case | Description |
|-----------|-------------|
| Variance calculation | `planned - actual`, handles negative (over-budget) |
| Percent used | `actual / planned × 100`, safe divide-by-zero |
| INR formatting | `₹` symbol and digit presence |
| Category sum | Reduce across multiple budget lines |
| Empty categories | Returns 0 safely |
| NaN amounts | Treated as 0 (falsy coalesce) |

### `src/__tests__/rsvpCalculations.test.ts`
Tests RSVP headcount aggregation logic.

| Test Case | Description |
|-----------|-------------|
| Attending count | Sums `partySize` for `'Accepted'` guests |
| Pending count | Sums `partySize` for `'Pending'` guests |
| Declined count | Sums `partySize` for `'Declined'` guests |
| Total headcount | All statuses combined |
| Empty list | Returns 0 |
| Zero party size | Defaults to 1 per guest |

### `src/__tests__/securitySanitizer.test.ts`
Tests `src/utils/security.ts` — critical XSS prevention.

| Test Case | Description |
|-----------|-------------|
| Strip `<script>` tags | Script blocks removed, clean text preserved |
| Strip `javascript:` URLs | Scheme removed |
| Strip inline event handlers | `onclick`, `onload`, etc. removed |
| Enforce `maxLength` | Output never exceeds cap |
| Allowed image MIME types | jpeg, png, webp → true; pdf, gif → false |
| File size limit | 4 MB → ok; 6 MB → rejected |
| Phone sanitization | Strips non-phone characters |

### `src/__tests__/dateUtils.test.ts`
Tests `src/utils/dateUtils.ts` — timezone-safe date parsing and countdown.

| Test Case | Description |
|-----------|-------------|
| YYYY-MM-DD parsing | No UTC day shift (local noon) |
| Null / empty inputs | Returns `null` safely |
| `'TBD'` / `'Date TBD'` strings | Returns `null` |
| `Date` instance | Passed through |
| Numeric timestamp | Parsed correctly |
| Firestore Timestamp-like | `.toDate()` invoked |
| Human date string | `'7 March 2028'` parsed |
| `formatDisplayDate` | Contains year, falls back to `'Date TBD'` |
| `calculateDaysCountdown` today | `isToday=true`, `days=0`, label `'Today'` |
| Future date | Positive `days`, label ends with `'Left'` |
| Past date | `isPast=true`, label ends with `'Ago'` |
| Singular label | `'1 Day Left'` / `'1 Day Ago'` (not "1 Days") |
| Null date | `days=null`, label `'Date TBD'` |

---

## 3. Test Architecture

```
src/
└── __tests__/
    ├── budgetCalculations.test.ts   # Pure math, no imports
    ├── rsvpCalculations.test.ts     # Pure math, no imports
    ├── securitySanitizer.test.ts    # Imports src/utils/security
    └── dateUtils.test.ts            # Imports src/utils/dateUtils
```

> [!TIP]
> Pure-function tests (budget, RSVP) define helper functions inline. This removes any dependency on the implementation files — the tests serve as a specification, not a coupling point.

---

## 4. Manual Verification Checklist

Use this checklist after each significant change or before a release:

### Authentication Flow
- [ ] Sign up with email + password creates a Firestore `users/{uid}` document
- [ ] Google sign-in works and merges with existing profile
- [ ] Signing out clears all local state; navigating to `/dashboard` redirects to `/login`
- [ ] Token refresh works without page reload (50-minute interval)

### Event Management
- [ ] Creating an event writes to Firestore `events/` with the correct `ownerId`
- [ ] Events from other users are not visible
- [ ] Editing an event name updates the sidebar in real time
- [ ] Deleting an event removes it from Firestore and all subcollections

### AI Plan Generation
- [ ] Submitting the plan form calls `/api/ai/generate-plan`
- [ ] A valid plan is displayed with tasks, budget, and milestones
- [ ] Approving the plan writes tasks to `tasks/` and budget to `expenses/`
- [ ] When the AI is unavailable, a deterministic fallback plan is shown

### Budget & Expenses
- [ ] Adding an expense updates the "Actual Spent" total
- [ ] Over-budget categories show a negative variance in red
- [ ] Currency symbol matches the event currency setting

### Guest & RSVP
- [ ] Accepting/Declining a guest updates headcount immediately
- [ ] Party size = 0 defaults to 1 in headcount calculations
- [ ] Guest list is sorted alphabetically

### Security
- [ ] Pasting `<script>alert(1)</script>` into any text field stores sanitized text
- [ ] Uploading a `.pdf` as an avatar is rejected before upload
- [ ] Uploading a file > 5 MB is rejected before upload

---

## 5. Future Testing Roadmap

| Priority | Task |
|----------|------|
| High | Add `@testing-library/react` for component smoke tests |
| High | Add Firebase emulator integration tests for Firestore rules |
| Medium | Add E2E tests with Playwright for the full sign-up → plan → approve flow |
| Medium | Add visual regression tests for the dashboard layout |
| Low | Add storybook stories for UI component library |
