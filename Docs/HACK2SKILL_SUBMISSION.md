# CelebrAI — Hack2Skill Official Submission Reference

**Event:** Hack2Skill AI Hackathon — Challenge 5  
**Project:** CelebrAI — Next-Generation AI Event Planning Platform  
**Lead Developer:** Shubham Kanani (`shubhamkanani.2006@gmail.com`)  
**Repository:** [https://github.com/Kanani-Shubham/CelebrAi](https://github.com/Kanani-Shubham/CelebrAi)  
**Live Deployed Application:** [https://celebr-ai.netlify.app/](https://celebr-ai.netlify.app/)  

---

## 1. Official Form Submission Links

| Form Field Name | Exact Submission Value | Notes / Instructions |
|---|---|---|
| **Public GitHub Repository Link** | `https://github.com/Kanani-Shubham/CelebrAi` | Verified public repository; clean Git tree (6.96 MB, well under 10 MB ceiling). |
| **Project Deployed Link** | `https://celebr-ai.netlify.app/` | Fully functional, live production deployment on Netlify. |
| **Project Demo Video Submission** | `https://youtube.com/shorts/j8jOsHhBtjU?feature=share` | Dedicated product demo & functional walkthrough on YouTube. |
| **LinkedIn Post** | `https://www.linkedin.com/posts/shubham-kanani-5694802b3_celebrai-hack2skill-artificialintelligence-ugcPost-7522188052555788288-GgMv/` | Direct URL to the public LinkedIn announcement showcasing CelebrAI ([Short Link](https://lnkd.in/p/d4VrMW3Y)). |
| **Instagram Reels Challenge URL** | `https://www.instagram.com/reel/DfJckDCIOv7/` | Official Instagram Reels challenge link. |
| **Official Hack2Skill AI Score** | **96.47 / 100** (Rank #206 of 51,695) | Captured October 31, 2026 (Attempt 2 of 3 completed, 1 attempt remaining). |

> **IMPORTANT SEPARATION NOTE:** The YouTube Demo Video (`https://youtube.com/shorts/j8jOsHhBtjU?feature=share`) and Instagram Reel (`https://www.instagram.com/reel/DfJckDCIOv7/`) are distinct submission tracks. The Instagram Reel link belongs in the Instagram Reels challenge field, while the YouTube link belongs in the project demo video field.

---

## 2. Pre-Formatted Copy-Paste Form Responses

### Field A: Changes and updates in the deployed version (Standard — 760 Characters)

```text
CelebrAI is an AI-powered event planning platform that unifies event creation, AI-generated plans, task and timeline management, budget and expense tracking, guest management, RSVP workflows and an event-aware AI Mentor in one workspace.

Built with React 19, TypeScript and Vite, with Firebase Auth and Firestore for persistence and Groq (defaulting to openai/gpt-oss-120b with meta-llama/llama-3.3-70b-versatile fallback) for fast, structured JSON generation. When AI is unavailable, a deterministic local planner ensures all flows remain functional.

Hardened with lazy routing, CSS design tokens, server-side rate limiting and token verification, a zero-warning oxlint pipeline, and a 170+ test Vitest suite with coverage thresholds.
```
*(Character count: 760 characters — fits safely within the 1024-character limit).*

### Alternative Compact Version (653 Characters)

```text
CelebrAI is an AI-powered event planning platform unifying event creation, AI plans, task runsheets, expense tracking, guest RSVP workflows and an event-aware AI Mentor.

Built with React 19, TypeScript and Vite, backed by Firebase Auth and Firestore, and powered by Groq (defaulting to openai/gpt-oss-120b with llama-3.3-70b-versatile fallback). A deterministic local planner guarantees offline functionality.

Hardened with lazy-loaded routes, CSS design tokens, server-side rate limiting and token verification, a zero-warning oxlint pipeline, and a 170+ test Vitest suite with coverage thresholds. Deployed on Netlify.
```
*(Character count: 653 characters).*

---

### Field B: Mention the Gen AI services utilized in the submission, and where did you utilize it? (Max 1024 Characters)

```text
CelebrAI utilizes the Groq Cloud API powered by the open-weights GPT-OSS 120B model (openai/gpt-oss-120b with meta-llama/llama-3.3-70b-versatile fallback) running on ultra-low latency Groq LPU hardware across three core application routes:

1. AI Plan Preview (/ai-plan-preview): Automatically decomposes host event details (type, budget, date, headcount, theme) into a comprehensive 4-part JSON blueprint comprising an executive concept summary, milestone checklists, categorized budget distributions, and countdown timelines.
2. AI Mentor (/ai): A stateful, multi-turn conversational event planning copilot injected with live host event context (active budget, remaining days, guest counts) and guided prompt chips.
3. Content Studio (/content-studio): Generates personalized digital invitation copy, WhatsApp broadcasts, itineraries, and host celebration speeches.

All AI calls pass through unified server-side proxies (Express & Netlify Functions) with rate limiting, Firebase token verification, and local deterministic fallback generators for offline resilience.
```
*(Character count: 1018 characters — fits safely within the 1024-character limit).*

---

## 3. Submission Verification Checklist

- [x] **Repository Public**: Verified reachable without authentication at `https://github.com/Kanani-Shubham/CelebrAi`.
- [x] **Repository Size**: 6.96 MB total repository size (well below the 10 MB ceiling).
- [x] **Zero Exposed Secrets**: Firebase Web API key decoupled to env vars with safe test fallbacks; zero active secret warnings.
- [x] **Production Deployment**: Netlify application at `https://celebr-ai.netlify.app/` builds and deploys cleanly.
- [x] **Automated Tests Verified**: 19 test suites, 173 tests passed, 0 failures, 100% pass rate.
- [x] **Coverage Thresholds Enforced**: Vitest coverage with lines, statements, functions, branches thresholds.
- [x] **Static Code Analysis**: 0 Oxlint warnings and 0 errors across 146 files (`oxlint --deny-warnings`); clean TypeScript compilation (`tsc -b`).
- [x] **Screenshot Evidence**: 39 verified screenshots committed in `Docs/screenshots/` (21 desktop, 18 mobile).
- [x] **Demo Video URL Attached**: Verified live on YouTube at `https://youtube.com/shorts/j8jOsHhBtjU?feature=share`.
- [x] **LinkedIn URL Attached**: Verified live at `https://www.linkedin.com/posts/shubham-kanani-5694802b3_celebrai-hack2skill-artificialintelligence-ugcPost-7522188052555788288-GgMv/`.
- [x] **Instagram Reels URL Attached**: Verified live at `https://www.instagram.com/reel/DfJckDCIOv7/`.
- [x] **Official Attempt 2 Score Documented**: 96.47/100, Rank #206 of 51,695.
