# CelebrAI — Automated Testing & Quality Assurance Report

**Test Framework:** Vitest v2.1.9  
**Execution Environment:** Node.js v24.19.2 (Antigravity Environment)  
**Report Date:** October 31, 2026  
**Status:** 100% Pass Rate (All 16 Test Suites Passed)  

---

## 1. Verified Execution Summary

```bash
> celebrai@0.0.0 test
> vitest run

 RUN  v2.1.9 E:/Project/CelebrAI

 ✓ src/__tests__/chatHistory.test.ts (4 tests) 12ms
 ✓ src/__tests__/validation.test.ts (14 tests) 15ms
 ✓ src/__tests__/securitySanitizer.test.ts (7 tests) 12ms
 ✓ src/__tests__/dateUtils.test.ts (20 tests) 47ms
 ✓ src/__tests__/budgetCalculations.test.ts (7 tests) 50ms
 ✓ src/__tests__/securityAndAccessControl.test.ts (10 tests) 19ms
 ✓ src/__tests__/markdownAndCodePolicy.test.ts (7 tests) 48ms
 ✓ src/__tests__/aiPlanGenerator.test.ts (10 tests) 61ms
 ✓ src/__tests__/taskAndNotificationEngine.test.ts (18 tests) 65ms
 ✓ src/__tests__/aiConfigAndSanitizer.test.ts (8 tests) 16ms
 ✓ src/__tests__/indexedDBAvatar.test.ts (8 tests) 47ms
 ✓ src/__tests__/rsvpCalculations.test.ts (6 tests) 10ms
 ✓ src/__tests__/modularStateAndReducers.test.ts (7 tests) 42ms
 ✓ src/__tests__/authService.test.ts (10 tests) 7ms
 ✓ src/__tests__/expenseManager.test.ts (9 tests) 8ms
 ✓ src/__tests__/e2eUserJourneys.test.ts (4 tests) 9ms

 Test Files  16 passed (16)
      Tests  149 passed (149)
   Duration  2.44s (transform 2.42s, tests 467ms)
```

| Verification Metric | Actual Measured Result |
|---|---|
| **Total Test Suites** | **16** |
| **Total Tests Executed** | **149** |
| **Tests Passed** | **149 (100%)** |
| **Tests Failed** | **0** |
| **Tests Skipped** | **0** |
| **Total Execution Duration** | **2.44 seconds** |
| **CI Integration** | Automated on push/PR via [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |

---

## 2. Test Suite Breakdown & Coverage Matrix

### 1. `aiConfigAndSanitizer.test.ts` (8 Tests)
- Verifies centralized AI models (`openai/gpt-oss-120b`, fallback `openai/gpt-oss-20b`).
- Tests system prompt safety sanitizers, control character elimination, and prompt injection mitigation.
- Validates offline fallback badge and fallback notice definitions.

### 2. `modularStateAndReducers.test.ts` (7 Tests)
- Tests decoupled state hooks (`useExpenses`, `useTasks`, `useGuests`).
- Verifies immutable event state reducers, task checklist toggles, and expense calculation pipelines.
- Validates error boundaries and optimistic state rollbacks.

### 3. `aiPlanGenerator.test.ts` (10 Tests)
- Verifies JSON structure returned by the AI plan synthesis engine.
- Tests validation of `conceptSummary`, `tasks`, `budgetBreakdown`, and `milestones`.
- Validates deterministic local fallback generation when external AI proxy is unreachable.
- Asserts that task priorities adhere strictly to `'High'`, `'Medium'`, or `'Low'`.

### 4. `budgetCalculations.test.ts` (7 Tests)
- Tests Indian Rupee (₹) currency formatting, thousands separators, and Lakh representations.
- Asserts calculated remaining budget: `remaining = totalPlanned - totalRecorded`.
- Verifies category summation across Venue, Food, Decor, Photography, Entertainment, and Contingency.

### 5. `dateUtils.test.ts` (20 Tests)
- Validates countdown calculation: `daysRemaining = targetDate - today`.
- Asserts boundary behaviors: Event today (0 days), Event tomorrow (1 day), Past event (negative days).
- Tests formatting for display strings: `"Jan 31, 2027"` and relative human-readable descriptors.

### 6. `rsvpCalculations.test.ts` (6 Tests)
- Verifies attendee summation: `totalAttending = confirmedGuests + partyAdditions`.
- Asserts breakdown counts across `Accepted`, `Declined`, and `Pending` states.
- Validates dietary preference categorization (Vegetarian, Vegan, Non-Veg, Halal).

### 7. `validation.test.ts` (14 Tests)
- Validates user input checks: email regex format, required string lengths, positive numbers for budgets.
- Verifies password strength score calculation.
- Tests boundary conditions on event creation forms.

### 8. `securitySanitizer.test.ts` (7 Tests)
- Tests XSS sanitization: stripping `<script>` tags, inline `onload`/`onerror`, and `javascript:` URIs.
- Verifies that benign markdown text and formatting tokens remain uncorrupted.

### 9. `securityAndAccessControl.test.ts` (10 Tests)
- Verifies row-level Firestore authorization logic (`request.auth.uid == userId`).
- Asserts that unauthenticated guests can only write RSVP responses without reading private budgets.

### 10. `indexedDBAvatar.test.ts` (8 Tests)
- Tests IndexedDB binary blob storage for user avatars in `celebrai_avatars`.
- Verifies fallback default avatar generation when IndexedDB is empty or uninitialized.

### 11. `taskAndNotificationEngine.test.ts` (18 Tests)
- Validates automatic deadline triggers: 30 days out, 7 days out, 1 day out.
- Tests notification status mutations (mark read, dismiss, clear all).

### 12. `markdownAndCodePolicy.test.ts` (7 Tests)
- Validates that AI assistant output is rendered through `SafeMarkdown.tsx`.
- Ensures zero raw executable script tags or eval statements.

### 13. `authService.test.ts` (10 Tests)
- Tests authentication observer callbacks and token handling.
- Validates sign-in error normalization and guest session states.

### 14. `expenseManager.test.ts` (9 Tests)
- Validates line-item addition, payment status toggling (`Paid` / `Pending`), and category assignments.

### 15. `chatHistory.test.ts` (4 Tests)
- Tests conversational turn persistence, role tagging (`user`, `assistant`), and session clearing.

### 16. `e2eUserJourneys.test.ts` (4 Tests)
- Tests complete user workflows: Creation Wizard -> Plan Synthesis -> Acceptance -> Command Center.
