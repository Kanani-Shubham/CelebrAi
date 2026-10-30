# Database Schema — CelebrAI Firestore

> [!NOTE]
> CelebrAI uses Cloud Firestore (NoSQL document database). All timestamps are Firestore `Timestamp` objects server-side; they may be serialized as ISO strings in local storage.

---

## Collection: `users/{uid}`

Stores the authenticated user's profile. Document ID = Firebase Auth `uid`.

| Field | Type | Description |
|-------|------|-------------|
| `uid` | `string` | Firebase Auth UID (mirrors document ID) |
| `email` | `string` | User's email address |
| `displayName` | `string` | Display name |
| `photoURL` | `string?` | Avatar URL (Firebase Storage or provider photo) |
| `phone` | `string?` | Sanitized phone number |
| `country` | `string` | ISO country code (e.g. `'IN'`) |
| `language` | `string` | Preferred language (e.g. `'English'`) |
| `currency` | `string` | Default currency (e.g. `'INR'`) |
| `planningStyle` | `string` | User preference: `'detailed'` or `'relaxed'` |
| `subscription` | `string` | `'free'` \| `'pro'` \| `'enterprise'` |
| `aiUsageToday` | `number` | AI calls made today (reset at midnight) |
| `aiUsageTotal` | `number` | Lifetime AI calls |
| `createdAt` | `Timestamp` | Account creation time |
| `updatedAt` | `Timestamp` | Last profile update |

---

## Collection: `events/{eventId}`

Stores event metadata. Auto-generated Firestore document ID.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Mirrors Firestore document ID |
| `ownerId` | `string` | UID of the event creator |
| `createdBy` | `string` | UID of the creating user (same as `ownerId` initially) |
| `eventName` | `string` | Name of the event (e.g. `'Celine & James Wedding'`) |
| `eventType` | `string` | Category (e.g. `'Wedding'`, `'Birthday'`, `'Corporate'`) |
| `eventDate` | `string` | Target date — ISO `'YYYY-MM-DD'` or human-readable string |
| `location` | `string` | City / venue address |
| `guestCount` | `number` | Expected number of guests |
| `budget` | `number` | Total budget in the event's currency |
| `currency` | `string` | Currency symbol or code (e.g. `'₹'`, `'USD'`) |
| `theme` | `string` | Chosen theme description |
| `coverImage` | `string` | URL to cover photo |
| `status` | `string` | `'active'` \| `'past'` \| `'archived'` |
| `tasksDone` | `number` | Count of completed tasks (denormalized) |
| `tasksTotal` | `number` | Total tasks count (denormalized) |
| `daysLeft` | `number` | Cached countdown (may be stale; compute live from `eventDate`) |
| `requirements` | `string?` | Free-text special requirements |
| `planSummary` | `string?` | AI-generated event summary |
| `themeSuggestions` | `string[]?` | AI theme ideas |
| `milestones` | `object[]?` | Array of `{ title, targetDate, description }` |
| `savedPlan` | `object?` | Full `AIPlanResult` snapshot at approval time |
| `archived` | `boolean` | Soft-delete flag |
| `isPublic` | `boolean` | Whether the event is publicly shareable |
| `collaborators` | `string[]` | UIDs of other users with access |
| `createdAt` | `Timestamp` | Creation time |
| `updatedAt` | `Timestamp` | Last modification time |

---

## Subcollection: `events/{eventId}/guests/{guestId}`

> [!NOTE]
> Guests are stored in the root `guests` collection (not a subcollection) with `eventId` as a field, enabling flat queries across events. The path above reflects the logical hierarchy.

**Actual Firestore path**: `guests/{guestId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Mirrors Firestore document ID |
| `eventId` | `string` | Parent event ID |
| `ownerId` | `string` | Event owner UID |
| `createdBy` | `string` | UID of user who added this guest |
| `name` | `string` | Guest full name |
| `partySize` | `number` | Number of people in this group (min 1) |
| `dietary` | `string` | `'Vegetarian'` \| `'Vegan'` \| `'Non-vegetarian'` \| `'Halal'` \| `'Gluten Free'` \| `'None'` |
| `status` | `string` | `'Accepted'` \| `'Pending'` \| `'Declined'` |
| `accessible` | `boolean?` | Accessibility requirement |
| `avatar` | `string?` | Profile photo URL |
| `table` | `string?` | Assigned table label |
| `email` | `string?` | Contact email |
| `phone` | `string?` | Contact phone |
| `notes` | `string?` | Additional notes |
| `createdAt` | `Timestamp` | Creation time |
| `updatedAt` | `Timestamp` | Last update time |

---

## Subcollection: `events/{eventId}/tasks/{taskId}`

**Actual Firestore path**: `tasks/{taskId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Mirrors Firestore document ID |
| `eventId` | `string` | Parent event ID |
| `ownerId` | `string` | Event owner UID |
| `createdBy` | `string` | UID of task creator |
| `title` | `string` | Task description |
| `category` | `string` | e.g. `'Venue'`, `'Catering'`, `'Decor'` |
| `priority` | `string` | `'High'` \| `'Medium'` \| `'Low'` |
| `dueDate` | `string` | Due date string (YYYY-MM-DD or human-readable) |
| `completed` | `boolean` | Completion flag |
| `assignedTo` | `string[]?` | List of assignee names |
| `notes` | `string?` | Task notes |
| `createdAt` | `Timestamp` | Creation time |
| `updatedAt` | `Timestamp` | Last update time |

---

## Subcollection: `events/{eventId}/expenses/{expenseId}`

**Actual Firestore path**: `expenses/{expenseId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Mirrors Firestore document ID |
| `eventId` | `string` | Parent event ID |
| `ownerId` | `string` | Event owner UID |
| `createdBy` | `string` | UID of expense creator |
| `title` | `string` | Expense description |
| `category` | `string` | e.g. `'Venue'`, `'Catering'`, `'Photography'` |
| `vendorName` | `string` | Vendor or payee name |
| `vendorImage` | `string?` | Vendor logo URL |
| `amount` | `number` | Amount in the event's currency |
| `status` | `string` | `'Paid'` \| `'Pending'` \| `'Overdue'` |
| `date` | `string?` | Payment date |
| `notes` | `string?` | Additional notes |
| `createdAt` | `Timestamp` | Creation time |
| `updatedAt` | `Timestamp` | Last update time |

---

## Collection: `conversations/{conversationId}`

Stores AI Mentor chat messages. Each document is a single message.

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | `string` | Associated event ID |
| `userId` | `string` | UID of the user in this conversation |
| `createdBy` | `string` | Same as `userId` |
| `role` | `string` | `'user'` \| `'assistant'` |
| `content` | `string` | Message text |
| `createdAt` | `Timestamp` | Message timestamp |
| `updatedAt` | `Timestamp` | Last update (usually same as `createdAt`) |

---

## Collection: `vendors/{vendorId}`

Vendors saved by users per event.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Mirrors Firestore document ID |
| `eventId` | `string` | Associated event |
| `ownerId` | `string` | Event owner UID |
| `name` | `string` | Vendor business name |
| `category` | `string` | Service category |
| `location` | `string` | Vendor location |
| `priceStart` | `string` | Starting price label |
| `rating` | `number` | Star rating (0–5) |
| `reviewsCount` | `number` | Number of reviews |
| `image` | `string` | Vendor image URL |
| `saved` | `boolean` | Saved-to-event flag |
| `notes` | `string?` | User notes about this vendor |
| `createdAt` | `Timestamp` | When saved |
| `updatedAt` | `Timestamp` | Last update |

---

## Collection: `notifications/{notifId}`

In-app notifications for users.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `string` | Target user UID |
| `title` | `string` | Notification title |
| `message` | `string` | Notification body |
| `type` | `string` | `'info'` \| `'warning'` \| `'success'` |
| `read` | `boolean` | Whether user has seen it |
| `createdAt` | `Timestamp` | Creation time |

---

## Indexing Notes

> [!TIP]
> Firestore requires composite indexes for multi-field queries. Create these in `firestore.indexes.json`:

| Collection | Fields | Order |
|------------|--------|-------|
| `events` | `ownerId`, `createdAt` | `ownerId ASC`, `createdAt DESC` |
| `guests` | `eventId`, `name` | `eventId ASC`, `name ASC` |
| `tasks` | `eventId`, `createdAt` | `eventId ASC`, `createdAt ASC` |
| `expenses` | `eventId`, `createdAt` | `eventId ASC`, `createdAt DESC` |
| `conversations` | `eventId`, `userId`, `createdAt` | all ASC |
