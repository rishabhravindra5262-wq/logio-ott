# Security Specification - ReelPlay (VidsApp)

## Data Invariants
1. **Series Integrity**: A series must have a non-empty title and valid thumbnail URLs.
2. **Video Association**: Every video (episode) must be explicitly linked to an existing Series via `seriesId`.
3. **Public Readiness**: Series and Videos are globally readable but only writeable by authorized administrators (currently handled server-side).

## The Dirty Dozen (Attack Payloads)
| # | Attack | Payload Example | Expected Result |
|---|---|---|---|
| 1 | **ID Poisoning** | `id: "junk-ID-!@#$%^&*()"` | PERMISSION_DENIED |
| 2 | **Large Write** | `title: "A" * 2000` | PERMISSION_DENIED |
| 3 | **Type Spoof** | `trending: "not-a-boolean"` | PERMISSION_DENIED |
| 4 | **Shadow Update** | `series.id + { 'ghostField': true }` | PERMISSION_DENIED |
| 5 | **Timestamp Spoof** | `createdAt: "2000-01-01"` | PERMISSION_DENIED |
| 6 | **Orphan Video** | `video.seriesId: "non-existent-id"` | PERMISSION_DENIED |
| 7 | **Unauthorized Delete** | `DELETE /series/123` (as guest) | PERMISSION_DENIED |
| 8 | **Privilege Escalation** | `video.likes: 999999` (via update) | PERMISSION_DENIED |
| 9 | **Malformed Regex** | `id: "too_long_id_more_than_128_chars..."` | PERMISSION_DENIED |
| 10 | **PII Leak** | `GET /private/userinfo` | PERMISSION_DENIED |
| 11 | **Batch Injection** | `batch.set(series) + batch.set(illegal_doc)` | PERMISSION_DENIED |
| 12 | **Immutable Warp** | `update series.createdAt` | PERMISSION_DENIED |

## Test Runner Logic
The `firestore.rules` will be validated against these payloads.
Currently, all writes are restricted to `false` on the client side, ensuring that only the Server (Admin SDK) can modify data. If client-side writes are enabled in the future, these rules will be unlocked with strict `isValid[Entity]` helpers.
