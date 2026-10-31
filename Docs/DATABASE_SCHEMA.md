# CelebrAI — Cloud Firestore Database Schema & Storage Models

**Database Engine:** Google Cloud Firestore (NoSQL Document Store)  
**Security Model:** Firebase Security Rules v2 with Row-Level Multi-Tenant Isolation  
**Local Persistence:** Client-Side IndexedDB (`celebrai_avatars`) + HTML5 Canvas Compression  
**Status:** Audited & Verified Against Production Rules  

---

## 1. Top-Level Architectural Overview

CelebrAI models all core business entities as flat top-level collections parameterized by `eventId` and `ownerId` / `userId`. This architecture enables performant compound indexing, collection-group queries, and granular row-level security:

```
Cloud Firestore (`celebrai-62487`)
├── users/{userId}                 # Private user profile & regional preferences
├── events/{eventId}               # Celebration metadata, total budget, target dates
├── tasks/{taskId}                 # Milestone tasks with priority, status, and deadlines
├── expenses/{expenseId}           # Financial line items, categories, and paid/pending status
├── guests/{guestId}               # Guest roster, party sizes, dietary notes, and RSVP status
├── conversations/{convId}         # AI Mentor chat threads with active event context
│   └── messages/{messageId}       # Individual user and assistant conversation turns
└── notifications/{notifId}        # In-app deadline alerts and event notifications
```

---

## 2. Collection Specifications

### A. Collection: `users/{userId}`
Stores authenticated account credentials and regional workspace preferences.  
**Document ID:** Firebase Auth User UID (`request.auth.uid`).  
**Access Rules:** Strictly private to the authenticated owner (`request.auth.uid == userId`). Deletion restricted to administrative workflows or GDPR requests.

| Field Name | Type | Constraints / Allowed Values | Description |
|---|---|---|---|
| `uid` | `string` | Matches document ID | Primary user identifier |
| `email` | `string` | Valid email regex | Authenticated user email address |
| `displayName` | `string` | Max 100 chars | Public display name |
| `photoURL` | `string?` | Valid URL / null | Cloud storage avatar URL |
| `phone` | `string?` | Sanitized phone string | User contact phone number |
| `country` | `string` | ISO 3166-1 alpha-2 (e.g., `'IN'`) | Host country code |
| `language` | `string` | Default `'English'` | Host user interface language |
| `currency` | `string` | Default `'INR'` (₹) | Default currency symbol & format |
| `planningStyle` | `string` | `'detailed'` \| `'relaxed'` | Host preference for task decomposition |
| `subscription` | `string` | `'free'` \| `'pro'` \| `'enterprise'` | Active tier entitlement |
| `aiUsageToday` | `number` | Positive integer | Daily AI API call counter |
| `createdAt` | `Timestamp` | Server timestamp | Account creation date |
| `updatedAt` | `Timestamp` | Server timestamp | Last profile modification |

---

### B. Collection: `events/{eventId}`
Stores top-level celebration details, budget caps, and AI-generated concept blueprints.  
**Document ID:** Auto-generated Firestore alphanumeric ID.  
**Access Rules:** Readable by owner, creator, collaborators, or publicly if `isPublic == true`. Writable only by owner or creator.

| Field Name | Type | Constraints / Allowed Values | Description |
|---|---|---|---|
| `id` | `string` | Auto-generated ID | Unique event identifier |
| `ownerId` | `string` | Firebase Auth UID | User identifier of the event owner |
| `createdBy` | `string` | Firebase Auth UID | User identifier of creating host |
| `eventName` | `string` | Max 120 chars | Name of celebration (e.g. "My Birthday Party") |
| `eventType` | `string` | `'Wedding'`, `'Birthday'`, `'Anniversary'`, `'Corporate'`, `'Community'`, `'College'`, `'Festival'`, `'Custom'` | Category classification |
| `eventDate` | `string` | ISO `'YYYY-MM-DD'` | Target celebration date |
| `location` | `string` | Max 200 chars | City, destination, or venue address |
| `guestCount` | `number` | Integer >= 1 | Estimated headcount |
| `budget` | `number` | Number >= 0 | Planned financial ceiling |
| `currency` | `string` | `'INR'`, `'USD'`, `'EUR'`, `'GBP'` | Active currency code |
| `theme` | `string` | Max 150 chars | Aesthetic styling description |
| `status` | `string` | `'active'` \| `'past'` \| `'archived'` | Lifecycle state |
| `tasksDone` | `number` | Integer | Denormalized count of completed tasks |
| `tasksTotal` | `number` | Integer | Denormalized count of all tasks |
| `requirements` | `string?` | Max 1000 chars | Host special instructions |
| `planSummary` | `string?` | Text | AI-generated celebration concept summary |
| `suggestedThemes` | `string[]?` | Array of strings | AI recommended theme keywords |
| `isPublic` | `boolean` | Default `false` | Enables public attendee microsite |
| `collaborators` | `string[]` | Array of UIDs | Co-hosts with access rights |
| `createdAt` | `Timestamp` | Server timestamp | Creation timestamp |
| `updatedAt` | `Timestamp` | Server timestamp | Last update timestamp |

---

### C. Collection: `tasks/{taskId}`
Milestone tasks and operational checklist items.  
**Document ID:** Auto-generated Firestore ID.  
**Access Rules:** Restricted to the event owner or confirmed collaborators (`isEventMember(resource.data.eventId)`).

| Field Name | Type | Allowed Values / Constraints | Description |
|---|---|---|---|
| `id` | `string` | Auto-generated ID | Unique task identifier |
| `eventId` | `string` | Valid event ID | Parent celebration reference |
| `ownerId` | `string` | Firebase Auth UID | Event owner UID |
| `title` | `string` | Max 200 chars | Actionable task name |
| `category` | `string` | `'Venue'`, `'Catering'`, `'Decor'`, `'Photography'`, `'Attire'`, `'Logistics'`, `'General'` | Functional task grouping |
| `priority` | `string` | `'High'`, `'Medium'`, `'Low'` | Operational urgency level |
| `isCompleted` | `boolean` | `true` \| `false` | Execution status |
| `dueDate` | `string?` | ISO date or null | Deadline date |
| `assignedTo` | `string?` | User ID or name | Co-host delegation |
| `createdAt` | `Timestamp` | Server timestamp | Creation timestamp |
| `updatedAt` | `Timestamp` | Server timestamp | Last update timestamp |

---

### D. Collection: `expenses/{expenseId}`
Financial ledger line items tracking budget utilization and invoice statuses.  
**Document ID:** Auto-generated Firestore ID.  
**Access Rules:** Restricted to the event owner or confirmed collaborators.

| Field Name | Type | Constraints / Allowed Values | Description |
|---|---|---|---|
| `id` | `string` | Auto-generated ID | Unique expense identifier |
| `eventId` | `string` | Valid event ID | Parent celebration reference |
| `ownerId` | `string` | Firebase Auth UID | Event owner UID |
| `title` | `string` | Max 150 chars | Vendor invoice or expense title |
| `category` | `string` | `'Venue'`, `'Food & Beverage'`, `'Decor'`, `'Photography'`, `'Entertainment'`, `'Contingency'` | Financial allocation category |
| `amount` | `number` | Number >= 0 | Recorded expenditure amount |
| `status` | `string` | `'Paid'`, `'Pending'`, `'Overdue'` | Settlement state |
| `dueDate` | `string?` | ISO date string | Payment deadline |
| `paidDate` | `string?` | ISO date string | Actual disbursement date |
| `notes` | `string?` | Text | Receipt notes or vendor terms |
| `createdAt` | `Timestamp` | Server timestamp | Creation timestamp |
| `updatedAt` | `Timestamp` | Server timestamp | Last update timestamp |

---

### E. Collection: `guests/{guestId}`
Guest roster records supporting both authenticated host management and unauthenticated public RSVP submissions.  
**Document ID:** Auto-generated Firestore ID (used as the public RSVP token).  
**Access Rules:**
- Read: Event members OR public attendee if querying with valid `guestId`.
- Create: Event members.
- Update: Event members OR public attendee updating their own RSVP fields (`status`, `partySize`, `dietary`, `notes`).
- Delete: Restricted to event owner.

| Field Name | Type | Allowed Values | Description |
|---|---|---|---|
| `id` | `string` | Auto-generated ID | Guest RSVP token |
| `eventId` | `string` | Valid event ID | Parent celebration reference |
| `ownerId` | `string` | Firebase Auth UID | Event owner UID |
| `name` | `string` | Max 100 chars | Guest full name |
| `partySize` | `number` | Integer 1 to 10 | Total attendees in party |
| `status` | `string` | `'Accepted'`, `'Pending'`, `'Declined'` | Attendance confirmation state |
| `dietary` | `string` | `'Vegetarian'`, `'Vegan'`, `'Non-vegetarian'`, `'Jain'`, `'Gluten Free'`, `'None'` | Dietary preference tag |
| `email` | `string?` | Valid email | Guest notification email |
| `phone` | `string?` | Valid phone string | Guest mobile number |
| `notes` | `string?` | Max 500 chars | Guest message to host |
| `updatedAt` | `Timestamp` | Server timestamp | Last update timestamp |

---

### F. Collection: `conversations/{convId}` and `messages`
AI Mentor conversation sessions and message logs.  
**Access Rules:** Private to the authenticated conversation initiator (`ownerId == request.auth.uid`).

| Document | Key Fields | Description |
|---|---|---|
| `conversations/{convId}` | `id`, `ownerId`, `eventId`, `title`, `lastMessage`, `createdAt`, `updatedAt` | Top-level chat session bound to active event |
| `.../messages/{msgId}` | `id`, `role` (`'user'` \| `'assistant'`), `content` (Markdown), `timestamp` | Message turns within the chat thread |

---

## 3. Client Storage Layer (IndexedDB & LocalStorage)

### IndexedDB Database: `celebrai_avatars`
- **Object Store:** `avatars`
- **Primary Key:** `uid` (string)
- **Stored Value:** `{ uid: string, dataUrl: string, mimeType: string, updatedAt: number }`
- **Purpose:** Caches compressed (`<100 KB`) profile photos locally on the host's device. Guarantees that avatars load instantaneously (0ms network delay) upon authentication and offline execution.

### LocalStorage Keys
- `celebrai_dev_mode`: Boolean toggle enabling the floating 36-page quick directory drawer.
- `celebrai_active_event_id`: Persists the currently selected active event ID across browser reloads.
- `celebrai_offline_draft`: Local temporary storage for in-flight event creation before cloud persistence.
