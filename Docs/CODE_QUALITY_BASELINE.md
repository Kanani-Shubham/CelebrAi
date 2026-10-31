# CelebrAI — Code Quality Baseline Audit

**Evaluation Target**: Hack2Skill Challenge 5 — Code Quality (Current: 88/100, Target: 99–100/100)  
**Date**: October 31, 2026  
**Auditor**: Senior TypeScript & React Architect  
**Branch**: `quality-refactor`

---

## 1. Actual Baseline Measurement Results

The initial baseline was established by executing the project's native build, lint, and test scripts:

| Benchmark / Tool | Measured Baseline | Status |
|---|:---:|---|
| **TypeScript Compiler (`tsc -b`)** | 0 errors | ✅ Clean compilation |
| **Oxlint Static Analysis (`oxlint --deny-warnings`)** | 0 errors, 0 warnings (143 files) | ✅ Zero warnings enforced |
| **Vitest Automated Suite (`npm test`)** | 19 suites, 173 tests passed, 0 failures | ✅ 100% pass rate (6.54s) |
| **Vite Production Build (`npm run build`)** | 0 errors, built in 886ms | ✅ Optimized 34-route code split |
| **Explicit `any` in Source** | 0 occurrences in `src/` | ✅ Clean type boundaries |
| **Direct `console.*` Calls** | 0 direct calls in `src/` | ✅ Sanitized logger facade |
| **Total Repository Size** | 6.96 MB | ✅ Well under 10 MB ceiling |

---

## 2. Key Structural & Architectural Findings

Despite passing static checks, an in-depth audit of the codebase revealed several architectural gaps that explain the 88/100 Code Quality ceiling:

### A. Domain Model Vagueness in `src/types/index.ts`
- **Loose String Enums**: `subscription: string`, `eventType: string`, `currency: string`.
- **Untyped Timestamps & Metadata**: `createdAt?: unknown`, `updatedAt?: unknown`, `savedPlan?: unknown`.
- **Legacy Compatibility Fields**: `EventItem` maintains both `eventDate: string` and optional `date?: string` without clear domain boundary enforcement.

### B. Excessive Double-Casting (`as unknown as`)
- A scan revealed **27 occurrences of `as unknown as Type`** across pages (`HomeDashboard`, `NotificationsCenter`, `TimelineCalendar`, `InvitationsRSVP`, `BudgetDashboard`, `Profile`, `AdminModeration`) and hooks (`useTasks`, `useExpenses`).
- **Root Cause**: Firestore service queries (`getEventTasks`, `getEventExpenses`, `getEventGuests`, `getDocumentsByOwner`) returned generic `DocumentData[]` or `Record<string, unknown>[]`, forcing UI components and custom hooks to bypass TypeScript's type system with double-casting.

### C. Missing Explicit Firestore Data Converters
- Database persistence and application domain models are conflated.
- Firestore `Timestamp` objects, ISO date strings, and nullables are checked ad-hoc via inline ternary expressions (`t.toDate?.() || t`) rather than through pure, centralized data converters (`fromFirestoreEvent`, `fromFirestoreTask`, `fromFirestoreExpense`, `fromFirestoreGuest`).

### D. TypeScript Strictness Headroom
- `tsconfig.app.json` currently sets `"noUnusedParameters": false`.
- Compiler strictness flags like `noImplicitReturns`, `noImplicitOverride`, and `noPropertyAccessFromIndexSignature` are not yet activated.

### E. Component Responsibility Density
- Several substantial pages still carry significant state and layout orchestration:
  - `PlanModals.tsx` (461 loc)
  - `AIPlanPreview.tsx` (459 loc)
  - `AIAssistant.tsx` (418 loc)
  - `HomeDashboard.tsx` (381 loc)
  - `CreateEvent.tsx` (380 loc)

---

## 3. Highest Risk Areas

1. **Firestore Converter Backward Compatibility**: Stored Firestore documents in production and cached mock objects must parse cleanly without crashing when encountering legacy date formats or missing optional fields.
2. **Preserving 173 Passing Tests**: Any type or converter change must preserve 100% test compatibility across all 19 Vitest test suites.
3. **Preserving Visual and Interactive Behavior**: 0 changes to UI layout, CSS animations, or user flows.

---

## 4. Execution Plan (Batches 1 to 5)

1. **Batch 1 — Domain Models & Converters**:
   - Refactor `src/types/index.ts` with strict domain unions (`SubscriptionTier`, `EventCategory`, `CurrencyCode`, `FirestoreTimestamp`).
   - Create pure domain converters (`fromFirestoreEvent`, `fromFirestoreTask`, `fromFirestoreExpense`, `fromFirestoreGuest`, `fromFirestoreProfile`).
2. **Batch 2 — Service Layer Strongly-Typed Generics**:
   - Update `src/services/firebase/firestore/` to return validated typed models (`Promise<TaskItem[]>`, `Promise<Expense[]>`, `Promise<Guest[]>`), eliminating the 27 `as unknown as` assertions.
3. **Batch 3 — TypeScript Strictness Hardening**:
   - Evaluate and enable `noUnusedParameters: true` and `noImplicitReturns: true` in `tsconfig.app.json`.
4. **Batch 4 — Component Decomposition**:
   - Extract focused sub-components from `AIAssistant.tsx` (Chat message list, composer, header) and `HomeDashboard.tsx`.
5. **Batch 5 — Test Verification & Final Audit**:
   - Verify `npm run lint`, `npx tsc -b`, `npm test`, and `npm run build` after every single batch.
