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
| **Public GitHub Repository Link** | `https://github.com/Kanani-Shubham/CelebrAi` | Verified public repository; clean Git tree under 10 MB. |
| **Project Deployed Link** | `https://celebr-ai.netlify.app/` | Fully functional, live production deployment on Netlify. |
| **Project Demo Video Submission** | `https://www.instagram.com/reel/DfJckDCIOv7/` | Official project demo video walkthrough. |
| **LinkedIn Post** | `https://lnkd.in/p/d4VrMW3Y` | Direct URL to the public LinkedIn announcement showcasing CelebrAI. |
| **Instagram Reels Challenge URL** | `https://www.instagram.com/reel/DfJckDCIOv7/` | Separate submission track for the Hack2Skill Instagram Reels Challenge. |

> **IMPORTANT SEPARATION NOTE:** The Instagram Reel link (`https://www.instagram.com/reel/DfJckDCIOv7/`) belongs exclusively in the Instagram Reels submission field. Do not place the Instagram Reel URL in the LinkedIn field.

---

## 2. Pre-Formatted Copy-Paste Form Responses

### Field A: Changes and updates in the deployed version (Max 1024 Characters)

```text
CelebrAI is a production-ready, AI-powered celebration operating system built with React 19, TypeScript, and Firebase. The deployed release features all 36 master specification pages, complete with an intuitive 4-step event setup wizard, an AI event plan generator powered by Groq GPT-OSS 120B, and an interactive AI Mentor with multi-turn conversation memory. Planning capabilities include dynamic budget allocations and expense tracking in Indian Rupees (₹), an automated task deadline engine with overdue alerts, and an end-to-end guest RSVP coordination system with public tokenized response links. The client architecture incorporates HTML5 Canvas image compression and IndexedDB local avatar caching for zero-latency rendering. The codebase passes 14 automated Vitest test suites (134/134 tests passed) and strict Oxlint validation with 0 errors, delivering high-contrast, WCAG 2.1 AA compliant responsive design across desktop and mobile devices.
```
*(Character count: 994 characters — fits safely within the 1024-character limit).*

---

### Field B: Mention the Gen AI services utilized in the submission, and where did you utilize it? (Max 1024 Characters)

```text
CelebrAI utilizes the Groq Cloud API powered by the open-weights GPT-OSS 120B model (openai/gpt-oss-120b) running on ultra-low latency Groq LPU hardware across three core application routes:

1. AI Plan Preview (/ai-plan-preview): Automatically decomposes host event details (type, budget, date, headcount, theme) into a comprehensive 4-part JSON blueprint comprising an executive concept summary, milestone checklists, categorized budget distributions, and countdown timelines.
2. AI Mentor (/ai): A stateful, multi-turn conversational event planning copilot injected with live host event context (active budget, remaining days, guest counts) and guided prompt chips.
3. Content Studio (/content-studio): Generates personalized digital invitation copy, WhatsApp broadcasts, itineraries, and host celebration speeches.

All AI calls pass through isolated server-side proxies (Express & Netlify Functions) with strict JSON regex sanitization, supported by local deterministic fallback generators for offline resilience.
```
*(Character count: 1018 characters — fits safely within the 1024-character limit).*

---

## 3. Submission Verification Checklist

- [x] **Repository Public**: Verified reachable without authentication at `https://github.com/Kanani-Shubham/CelebrAi`.
- [x] **Repository Size**: 6.38 MiB Git size (well below the 10 MB ceiling).
- [x] **Zero Exposed Secrets**: Neither `.env` nor `.env.example` is committed or tracked in Git.
- [x] **Production Deployment**: Netlify application at `https://celebr-ai.netlify.app/` builds cleanly.
- [x] **Automated Tests Verified**: 14 test suites, 134 tests passed, 0 failures.
- [x] **Static Code Analysis**: 0 Oxlint errors across 78 files; clean TypeScript compilation (`tsc -b`).
- [x] **Screenshot Evidence**: 39 verified screenshots committed in `Docs/screenshots/` (21 desktop, 18 mobile).
- [x] **Demo Video URL Attached**: Verified live at `https://www.instagram.com/reel/DfJckDCIOv7/`.
- [x] **LinkedIn URL Attached**: Verified live at `https://lnkd.in/p/d4VrMW3Y`.

