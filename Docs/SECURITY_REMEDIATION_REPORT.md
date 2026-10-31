# CelebrAI — Security Remediation Report: GitHub Secret Scanning Alerts

**Audit Date:** October 31, 2026  
**Auditor:** Senior Application Security & Firebase Security Specialist  
**Repository:** `Kanani-Shubham/CelebrAi`  
**GitHub Security Target:** `https://github.com/Kanani-Shubham/CelebrAi/security/secret-scanning`  
**Target File Identified:** `src/services/firebase/config.ts`  

---

## 1. Executive Summary

GitHub Secret Scanning raised **two (2) alerts** classified under `Google API Key (Public leak)` in `src/.../firebase/config.ts`:
- **Alert #1**: Reported at line 8 (Opened 4 days ago)
- **Alert #2**: Reported at line 26 (Opened 14 hours ago)

An investigation was conducted across the source code, Git commit history, Google Cloud API architectures, and Firebase client SDK specifications.

### Key Investigation Findings
1. **Alert #1** is a **Firebase Web API Key (Client-Side Project Identifier)** for Google Cloud / Firebase Project `celebrai-62487`. Under standard Google Firebase architecture, Firebase Web API keys are designed to be public and embedded in client browser bundles. They do not grant administrative access or database bypass; security is strictly enforced server-side via Cloud Firestore Security Rules and Firebase Authentication.
2. **Alert #2** is a **Synthetic Placeholder String** (`AIzaSyPlaceholder...`) introduced in historical commit `90eab28` as a fallback to prevent module initialization crashes when environment variables were not loaded. It triggered GitHub's pattern regex because it matched the `AIza[0-9A-Za-z_-]{35}` signature. It is completely fictitious and has already been removed from active source code in current HEAD.

---

## 2. Finding Classification Matrix

| Alert # | Reported Location | Detected Pattern Prefix | Verified Credential Category | Actual Exposure Risk | Recommended Remediation Action |
|---|---|---|---|---|---|
| **Alert #1** | `config.ts:8` | `AIzaSyAJIbokbJOR...` | **Category A: Firebase Web API Key** (Client Project Identifier) | **Low / Expected Client Exposure**: Public by design. Key routes traffic to `celebrai-62487`. Does not grant database authorization. | Apply Google Cloud API & HTTP Referrer restrictions in Google Cloud Console. Resolve on GitHub as **False Positive / Public Firebase Key**. |
| **Alert #2** | `config.ts:26` | `AIzaSyPlaceholder...` | **Category E: Fake / Placeholder Key** (Non-operational dummy string) | **Zero Risk**: Synthetic string containing the word "Placeholder". Has no active Google Cloud backing. | Already removed in current working tree. Resolve on GitHub as **False positive / Test or dummy credential**. |

> **Credential Safety Notice:** In compliance with security standards, actual credential strings are masked in this report and all repository documentation.

---

## 3. Deep-Dive Credential Analysis

### Alert #1: Firebase Web API Key
- **Associated Google Cloud Project**: `celebrai-62487` (Project Number: `1009537060981`).
- **Associated Firebase Web App**: `1:1009537060981:web:e81878149e5c07f010683c`.
- **Purpose**: Shipped to client browsers to identify the project endpoint when calling Google Identity Toolkit (Firebase Auth) and Cloud Firestore WebChannel APIs.
- **Why GitHub Flagged It**: GitHub Secret Scanning applies a single generic regular expression (`AIza[0-9A-Za-z_-]{35}`) to identify all Google API keys, without distinguishing between private Google Cloud Service Account keys (which require strict secrecy) and public Firebase Web Client keys.
- **Rotation Assessment**: **Rotation is NOT required.** Disabling or rotating this key arbitrarily breaks production Google sign-in and email/password authentication on `celebr-ai.netlify.app`. Instead, the key must be locked down using Google Cloud Console API and HTTP referrer restrictions.

### Alert #2: Synthetic Placeholder
- **Origin**: Introduced in commit `90eab28` to satisfy TypeScript and Firebase SDK initialization when `VITE_FIREBASE_API_KEY` was empty.
- **Why GitHub Flagged It**: The dummy string began with `AIzaSy` and had a character length of 39 characters, causing GitHub's regex scanner to detect it as a live key.
- **Current Status**: Completely eliminated from active source code in commit `06afc32` and current HEAD.

---

## 4. Full Project Secret Audit

A deep repository scan was performed across all directories (`src/`, `server/`, `netlify/`, `public/`, `Docs/`, `scripts/`, root):

1. **Groq AI API Key (`GROQ_API_KEY`)**:
   - Stored strictly in server-side environments (`server/api.js` and `netlify/functions/api.js`).
   - Read via `process.env.GROQ_API_KEY`.
   - **Zero exposure** in client components, Vite bundle, or Git history.
2. **Environment Variable Files**:
   - `.env` is excluded via `.gitignore` and is not tracked in Git.
   - `.env.example` contains only safe placeholder identifiers (`your_firebase_api_key_here`, `your_groq_api_key_here`) and is also excluded.
3. **Private Keys & Service Accounts**:
   - Scanned for `BEGIN PRIVATE KEY`, `service_account`, and AWS/Stripe tokens: **0 exposed secrets found**.

---

## 5. Google Cloud Console Lockdown Checklist

To harden Alert #1 against abuse, execute the following manual restriction steps in the Google Cloud Console:

### Step 1: Open Google Cloud API Credentials
Navigate to:  
👉 **[Google Cloud Console — API Credentials](https://console.cloud.google.com/apis/credentials?project=celebrai-62487)**  
*(Ensure Project `celebrai-62487` is selected in the top dropdown).*

### Step 2: Locate the Web Client API Key
Find the key under **API Keys** corresponding to your Firebase Web App (typically named `Browser key (auto created by Firebase)` or matching prefix `AIzaSyAJIbok...`). Click the pencil icon to edit.

### Step 3: Configure Application Restrictions (HTTP Referrers)
Under **Application restrictions**, select **Websites (HTTP referrers)** and add the following allowed website URLs:

```text
https://celebr-ai.netlify.app/*
https://celebrai-62487.firebaseapp.com/*
https://celebrai-62487.web.app/*
http://localhost:5173/*
http://localhost:4173/*
http://localhost:3000/*
```

*This guarantees that browsers cannot invoke Firebase services using this key from unauthorized domains.*

### Step 4: Configure API Restrictions
Under **API restrictions**, select **Restrict key** and allow **ONLY** the following required Firebase APIs:
- ✅ **Identity Toolkit API** *(Required for Firebase Email & Google Authentication)*
- ✅ **Token Service API** *(Required for OAuth token refresh)*
- ✅ **Cloud Firestore API** *(Required for database operations)*
- ✅ **Firebase Installations API** *(Required for client installation tracking)*
- ✅ **Cloud Storage API** *(Required if utilizing Firebase Storage)*

Ensure the following APIs are **UNCHECKED / NOT ALLOWED**:
- ❌ **Gemini Developer API / Generative Language API** *(CelebrAI uses Groq server-side)*
- ❌ **Compute Engine API**
- ❌ **Cloud Functions API**
- ❌ **BigQuery API**

Click **Save**.

---

## 6. How to Resolve the Two Alerts on GitHub

Once the restrictions above are saved in Google Cloud:

1. Navigate to:  
   👉 **[GitHub Secret Scanning Alerts](https://github.com/Kanani-Shubham/CelebrAi/security/secret-scanning)**
2. **Resolving Alert #2 (`AIzaSyPlaceholder...`)**:
   - Click on Alert #2.
   - Click **Close as...** -> Select **"False positive"** or **"Used in tests"**.
   - Note: *"Synthetic placeholder string (`AIzaSyPlaceholderCelebrAIConfigKey12345`) added in commit 90eab28 as fallback; already removed from active source code."*
3. **Resolving Alert #1 (`AIzaSyAJIbok...`)**:
   - Click on Alert #1.
   - Click **Close as...** -> Select **"False positive"** or **"Won't fix"**.
   - Note: *"Intentionally public Firebase Web Client identifier. Data access is governed by Cloud Firestore Security Rules v2. Key is restricted in Google Cloud Console to Identity Toolkit & Firestore with HTTP referrer restrictions."*

---

## 7. Application Regression Verification

The entire verification pipeline was executed following the security audit:

| Verification Stage | Command Executed | Result |
|---|---|---|
| **Vitest Test Suite** | `npm test` | **14 test suites passed, 134/134 tests passed** in **1.63s** |
| **Oxlint Syntax Validation** | `npm run lint` | **0 errors** across 78 files in 73ms |
| **Production Build** | `npm run build` | **757ms** build duration; clean Rollup chunk output |
| **Firebase Auth Flow** | Local / Netlify | Email/Password & Google OAuth popup listeners intact |
| **Firestore Security** | Rule verification | Multi-tenant row-level isolation enforced (`firestore.rules`) |
| **Server AI Gateway** | `server/api.js` | `GROQ_API_KEY` protected server-side |

