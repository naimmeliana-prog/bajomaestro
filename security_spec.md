# Security Specification — BajoMaestro Firestore Rules

## 1. Data Invariants
1. A `UserProfile` document at `/users/{userId}` can only be created, read, or updated by the authenticated, email-verified user whose `request.auth.uid == userId`, and `uid` must match `userId`.
2. Subcollection documents (`lessonProgress`, `practiceItems`, `practiceLogs`) can only exist if the parent `/users/{userId}` profile document already exists (Master Gate via `exists()`), and `userId` in the document payload must match both `{userId}` and `request.auth.uid`.
3. `createdAt` is server-timestamped (`request.time`) on creation and strictly immutable on updates. `updatedAt` must equal `request.time` on every creation or update.
4. No arbitrary extra keys ("ghost fields") are permitted on any collection (`hasAll` + `hasOnly` on create; `affectedKeys().hasOnly(...)` on update).
5. All document IDs (`userId`, `lessonId`, `itemId`, `logId`) must match `^[a-zA-Z0-9_-]+$` and be <= 128 chars.
6. Every string has strict `.size()` bounds; every numeric field has strict min/max range validation.
7. `practiceLogs` are append-only historical logs (deletable by owner, not tamperable into fake past timestamps).

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated read/write**: `auth: null`, `get('/users/alice')`.
2. **Unverified email write**: `auth: { uid: 'alice', token: { email_verified: false } }`, `set('/users/alice', validProfile)`.
3. **Cross-user PII read**: `auth: { uid: 'bob', token: { email_verified: true } }`, `get('/users/alice')`.
4. **Cross-user list scraping**: `auth: { uid: 'bob', token: { email_verified: true } }`, `list('/users/alice/lessonProgress')`.
5. **Identity spoofing on create**: `auth: { uid: 'bob', token: { email_verified: true } }`, `set('/users/bob/lessonProgress/l1', { ...valid, userId: 'alice' })`.
6. **Ghost field / Shadow Update**: `set('/users/bob', { ...validProfile, isAdmin: true })`.
7. **Orphaned subcollection write (Missing parent profile)**: `set('/users/bob/practiceItems/item1', validItem)` before `/users/bob` exists.
8. **ID Poisoning (>128 chars / invalid chars)**: `set('/users/bob/lessonProgress/' + 'a'.repeat(200), validProgress)`.
9. **Client-forged timestamp**: `set('/users/bob', { ...validProfile, createdAt: new Date('2020-01-01') })`.
10. **Immutable field tampering on update**: `update('/users/bob/lessonProgress/l1', { createdAt: serverTimestamp(), updatedAt: serverTimestamp() })`.
11. **Value poisoning / Out-of-bounds integer**: `update('/users/bob/lessonProgress/l1', { masteryPercent: 9999, updatedAt: serverTimestamp() })`.
12. **Blanket collection enumeration**: `list('/users')` by any user.
