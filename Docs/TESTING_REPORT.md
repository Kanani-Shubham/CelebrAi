# CelebrAI — Automated Testing & Quality Assurance Report

**Test Framework:** Vitest v2.1.9  
**Execution Environment:** Node.js v24.19.2 (Antigravity Environment)  
**Report Date:** October 31, 2026  
**Status:** 100% Pass Rate (All 14 Test Suites Passed)  

---

## 1. Verified Execution Summary

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
   Duration  1.99s (Transform: 2.49s, Setup: 0ms, Collect: 6.59s, Tests: 281ms)
```

| Verification Metric | Actual Measured Result |
|---|---|
| **Total Test Suites** | **14** |
| **Total Tests Executed** | **134** |
| **Tests Passed** | **134 (100%)** |
| **Tests Failed** | **0** |
| **Tests Skipped** | **0** |
| **Total Execution Duration** | **1.99 seconds** |

---

## 2. Test Suite Breakdown & Coverage Matrix

### 1. `aiPlanGenerator.test.ts` (10 Tests)
- Verifies JSON structure returned by the AI plan synthesis engine.
- Tests validation of `conceptSummary`, `tasks`, `budgetBreakdown`, and `milestones`.
- Validates deterministic local fallback generation when the external AI proxy is unreachable.
- Asserts that task priorities adhere strictly to `'High'`, `'Medium'`, or `'Low'`.

### 2. `budgetCalculations.test.ts` (7 Tests)
- Tests Indian Rupee (₹) currency formatting, thousands separators, and Lakh representations.
- Asserts calculated remaining budget: `remaining = totalPlanned - totalRecorded`.
- Verifies category summation across Venue, Food, Decor, Photography, Entertainment, and Contingency.
- Validates over-budget warning triggers and boundary zero-budget calculations.

### 3. `expenseManager.test.ts` (9 Tests)
- Validates status transitions between `'Paid'`, `'Pending'`, and `'Overdue'`.
- Tests expense addition, updates, and soft-delete behavior.
- Verifies paid sum vs pending sum aggregation calculations.

### 4. `dateUtils.test.ts` (20 Tests)
- Asserts days-until-celebration countdown calculations across past, present, and future dates.
- Tests human-readable date formatting (e.g., "31 Jan 2027").
- Verifies ISO timestamp transformations and timezone offset safety.

### 5. `taskAndNotificationEngine.test.ts` (18 Tests)
- Verifies automated task deadline status calculations (`'Due Today'`, `'Overdue'`, `'Pending'`, `'Completed'`).
- Tests notification alert generation based on task urgency and upcoming event milestones.
- Validates deduplication logic ensuring duplicate notification cards are not generated.

### 6. `rsvpCalculations.test.ts` (6 Tests)
- Asserts headcount aggregation by RSVP state: `Accepted`, `Pending`, `Declined`.
- Validates total attendee counts accounting for `partySize` and plus-one additions.

### 7. `validation.test.ts` (14 Tests)
- Tests email regex validation, phone number character stripping, and name length checks.
- Validates budget numerical boundaries (positive integers) and event date validity.

### 8. `securitySanitizer.test.ts` (7 Tests)
- Tests neutralization of malicious `<script>` tags, inline `onload`/`onerror` handlers, and `javascript:` URIs.
- Validates stripping of disallowed HTML elements while preserving valid text formatting.

### 9. `securityAndAccessControl.test.ts` (10 Tests)
- Verifies image MIME type whitelisting (`image/jpeg`, `image/png`, `image/webp`).
- Asserts file size limits (`< 5 MB`) and validates multi-tenant user access boundaries.

### 10. `indexedDBAvatar.test.ts` (8 Tests)
- Tests client-side IndexedDB database initialization (`celebrai_avatars`).
- Asserts binary blob storage, Base64 retrieval, key updating, and deletion routines using `fake-indexeddb`.

### 11. `authService.test.ts` (10 Tests)
- Validates sign-in and registration input sanitation.
- Tests token refresh callback triggers and mock Firebase Auth state transitions.

### 12. `chatHistory.test.ts` (4 Tests)
- Verifies AI Mentor conversation session initialization.
- Validates message persistence, multi-turn ordering, and timestamp sorting.

### 13. `markdownAndCodePolicy.test.ts` (7 Tests)
- Verifies safe markdown rendering for headings, lists, tables, and bold tags.
- Asserts that raw execution scripts embedded in markdown are sanitized.

### 14. `e2eUserJourneys.test.ts` (4 Tests)
- Validates end-to-end integration journeys:
  1. Event Creation -> AI Plan Generation -> Plan Approval.
  2. Plan Approval -> Dashboard Metric Population.
  3. Expense Addition -> Budget Donut Update.
  4. Guest RSVP Submission -> Guest Count Update.

---

## 3. How to Execute Tests Locally

### Run All Tests Once
```bash
npm test
```

### Run in Watch Mode (Interactive Development)
```bash
npx vitest
```

### Run a Specific Test Suite
```bash
npx vitest run src/__tests__/aiPlanGenerator.test.ts
```
