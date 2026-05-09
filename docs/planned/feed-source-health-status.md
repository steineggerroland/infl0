# Package: Feed source health status

## Status

Draft

## Goal

Show users whether their sources are **working**, **pending**, **quiet**, or **need attention** from the existing **`/feeds`** area.

Users should be able to answer:

- Has this source been processed yet?
- Did the last processing run work?
- When can I expect new content?
- Is this source currently quiet, blocked, or still being configured?
- Which sources are likely underrepresented in my timeline? *(signals prepared for later; dominance metrics follow separately)*

## Non-goals

- Do not build an operator/admin dashboard in this package.
- Do not expose technical crawler logs to regular users.
- Do not let users edit crawler policies yet.
- Do not implement source recommendations or source dominance balancing yet.

## Dependencies

- [`../archive/26-05-10-source-health-api-contract.md`](../archive/26-05-10-source-health-api-contract.md) (Prisma `SourceStatus`, `GET /api/source-statuses`, `POST /api/crawler/source-status`)
- Existing `/feeds` page
- Existing authenticated user/feed APIs
- i18n: `i18n/locales/de.json`, `i18n/locales/en.json`
- House style: [`docs/CONTENT_AND_A11Y.md`](../CONTENT_AND_A11Y.md)

## Acceptance criteria

1. **`/feeds`** includes source status information for each active feed/source.
2. Status labels are **user-facing and calm** (exact keys → copy via i18n):

   | Key | Label (EN reference) |
   |-----|----------------------|
   | `pending` | Waiting for first processing |
   | `needs_setup` | Needs setup |
   | `healthy` | Working |
   | `quiet` | No recent new items |
   | `degraded` | Some problems |
   | `failing` | Not working |
   | `blocked` | Blocked by source |
   | `paused` | Paused |

3. Each source row/card shows when available:
   - last successful processing time
   - next expected processing time
   - latest status label
   - short **accessible** explanation
4. Technical errors are **summarized**, not dumped; detail behind an info popover or help link.
5. **`needs_setup`**: explains that infl0 is still understanding the source or operator setup may be required.
6. **`quiet`**: **not** presented as broken.
7. UI distinguishes **“not yet processed”** from **“processed but no candidates”**.
8. Timeline representation **signals** prepared for later use:
   - show recent `crawlProcessedCount`
   - show recent `crawlCandidateCount`
   - optionally “Recently active” / “Rarely new” copy
9. Component or BDD tests cover at least: **pending**; **healthy**; **quiet**; **failing/degraded**; **no source-status row yet**.
10. Page remains **accessible**: status not color-only; labels screen-reader understandable; popovers/buttons have accessible names.

## Implementation notes

### Page model (reference)

```ts
type SourceHealthStatus =
  | 'pending'
  | 'needs_setup'
  | 'healthy'
  | 'quiet'
  | 'degraded'
  | 'failing'
  | 'blocked'
  | 'paused'
```

### Copy direction (longer explanations)

- **pending**: This source is waiting for its first processing run.
- **healthy**: This source was processed successfully.
- **quiet**: The source was checked, but no new usable items were found.
- **degraded**: Some items could not be processed.
- **failing**: The latest processing run failed.
- **blocked**: The source appears to block parts of the processing.
- **needs_setup**: infl0 still needs a working source configuration.
- **paused**: Processing is currently paused by policy or source limits.

Do **not** expose `crawlFetchErrorCount` as the primary message to users; use it for tone and severity only.

### Future follow-up

Add dominance / underrepresentation once there is a stable per-user source share metric.

## Links

- PR:
- Discussion:
- Related: [`../archive/26-05-10-source-health-api-contract.md`](../archive/26-05-10-source-health-api-contract.md), [`operator-source-observability.md`](./operator-source-observability.md)
