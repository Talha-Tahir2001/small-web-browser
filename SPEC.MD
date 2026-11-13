# SPEC — Wyxan: The Small Web and the Browser You Read It In

**Status:** Draft for review · **Companion to:** `PRD.MD`
**Stack:** Next.js 16 (App Router) · NestJS 12 · MongoDB 8 · Mongoose 9 · TypeScript

---

## 1. Architecture

### 1.1 Two processes, two origins

```
┌──────────────────────────────────────────────────────────────┐
│  Browser tab — http://localhost:3000                          │
│  Next.js 16 (apps/web)                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Chrome: address bar · back/forward · history · search  │  │
│  │         publish · person picker                        │  │
│  │ ┌──────────────────────────────────────────────────┐    │  │
│  │ │ Viewport                                          │    │  │
│  │ │  kind=page    → <iframe src=127.0.0.1:4000/render> │    │  │
│  │ │  kind=search  → React results panel                │    │  │
│  │ └──────────────────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                    │ fetch (JSON, CORS)
                    ▼
┌──────────────────────────────────────────────────────────────┐
│  http://127.0.0.1:4000 — NestJS 12 (apps/api)               │
│  /api/*      JSON API (sites, people, search, visits,        │
│              history, navigation)                            │
│  /render/:id text/html  ← iframe target, sandboxed document │
│              serves the stored snapshot, never live content  │
└──────────────────────────────────────────────────────────────┘
                    │
                    ▼
              MongoDB 8 (docker compose)  db: wyxan
```

**Why two origins.** `localhost` and `127.0.0.1` are different origins to a browser. Published
pages are served from the API origin (`127.0.0.1:4000`), so a published page can never be
same-origin with the app (`localhost:3000`). Even if the sandbox flags were wrong, the page
would still not reach app cookies, storage or DOM. The origin split is load-bearing; the sandbox
is the second layer, not the first.

**Why the render endpoint serves snapshots.** `/render/:visitId` returns the content **as it was
at the time of that arrival**, not the live site. This is what makes restore-on-return exact, and
it means the page in the iframe and the page in history can never disagree.

### 1.2 Monorepo layout

```
wyxan/
├─ package.json              # npm workspaces root; scripts: dev, seed, test, lint
├─ docker-compose.yml        # mongo:8 on 27017, named volume
├─ .env.example
├─ apps/
│  ├─ api/                    # NestJS 12
│  │  ├─ src/
│  │  │  ├─ main.ts           # bootstrap: CORS, helmet-style headers, port 4000
│  │  │  ├─ app.module.ts
│  │  │  ├─ common/           # address normalisation, html→text, pagination
│  │  │  ├─ people/           # people module
│  │  │  ├─ sites/            # publish / read / searchText derivation
│  │  │  ├─ visits/           # visit recording, snapshots
│  │  │  ├─ history/          # browser state: stack, cursor, back/forward/jump
│  │  │  ├─ search/           # text index query + snippets
│  │  │  └─ render/           # sandboxed HTML delivery
│  │  └─ scripts/seed.ts      # deterministic seed command
│  └─ web/                    # Next.js 16 App Router
│     ├─ app/
│     │  ├─ layout.tsx
│     │  ├─ page.tsx          # the browser shell (client)
│     │  └─ globals.css
│     ├─ components/          # AddressBar, Toolbar, Viewport, HistoryPanel,
│     │                       # SearchPanel, PublishPanel, PersonPicker
│     ├─ lib/                 # api client, browser state reducer
│     └─ next.config.ts
└─ packages/
   └─ shared/                 # types + pure logic, no runtime deps
      ├─ src/address.ts       # normaliseAddress(), isInWeb(), resolveKind()
      ├─ src/history.ts       # history state machine (pure)
      ├─ src/search.ts        # html→text, searchText derivation, snippets
      ├─ src/types.ts         # shared DTO shapes
      └─ src/index.ts
```

`packages/shared` holds the two pieces of logic that must be provably correct: **address
normalisation** and the **history state machine**. Both are pure, dependency-free, and unit
tested; the API imports the state machine so the server and the tests agree by construction.

It is published as **ESM + declarations** (`tsc -p tsconfig.build.json` → `dist/`), and both apps
consume it through the workspace name `@wyxan/shared` — the API with `import`, the web app through
Turbopack. One build output, two consumers, no dual-publish step.

### 1.3 Pinned versions

| Package | Version | Note |
| :-- | :-- | :-- |
| `next` | 16.4.6 | App Router; Turbopack is the default bundler |
| `react` / `react-dom` | 19.3.x | |
| `@nestjs/*` | 12.5.0 | ESM-only — see §1.3.1 |
| `mongoose` | 9.12.x | MongoDB driver 7.8 |
| `mongodb` (server) | 8.x | via `docker-compose.yml` |
| `typescript` | **6.0.3** in `apps/api` · **7.0.2** in `packages/shared` and `apps/web` | see §1.3.2 |
| `vitest` | 4.1.x | test runner for both packages |
| `oxlint` | 1.x | linter (the NestJS 12 scaffold default) |
| `prettier` | 3.x | formatting |
| `npm` | **12.x** | workspaces; see §1.3.3 |
| Node | 24.x LTS (≥ 22.12) | |

Exact versions are captured in `package-lock.json` at scaffold time.

#### 1.3.1 Module format: ESM throughout

The API is **ESM**, not CommonJS. This is not a preference — it is forced:

- `@nestjs/common@12` ships `"type": "module"` with a single ESM entry point and no CJS build.
- Under `moduleResolution: nodenext`, a CommonJS API fails to compile:
  `TS1479: The current file is a CommonJS module whose imports will produce 'require' calls;
  however, the referenced file is an ECMAScript module`.

So `apps/api/package.json` declares `"type": "module"`, `apps/api/tsconfig.json` uses
`"module": "nodenext"` / `"moduleResolution": "nodenext"` / `"resolvePackageJsonExports": true`,
and relative imports carry the `.js` extension. `packages/shared` is ESM too, built by `tsc` to
ESM + declarations, so the API and the web app consume the *same* module shape.

The assessment grades behaviour, not module format; this removes moving parts rather than adding
them. Nothing in the brief requires CommonJS.

#### 1.3.2 TypeScript: two versions, on purpose

- `apps/api` is on **TypeScript 6.0.3**. `@nestjs/schematics@12` declares a hard peer dependency
  on `typescript >= 6.0.0`, and `@nestjs/cli` additionally needs the *programmatic* compiler API.
  TypeScript 7.0.2 does not expose it yet, and `nest build` fails with:
  `The installed TypeScript version (7.0.2) does not expose the programmatic compiler API that the
  Nest CLI requires. TypeScript 7.0 ships the "tsc" executable only; the compiler API is expected
  to return in 7.1.`
- `packages/shared` and `apps/web` are on **TypeScript 7.0.2** (current `latest`). Both are
  verified against it: the shared package compiles with `tsc -p`, and `next build` type-checks
  cleanly.

Both versions are declared per-package rather than at the root, so each consumer gets the
compiler it needs and npm resolves them independently.

#### 1.3.3 Package manager: npm 12 workspaces

The monorepo uses **npm workspaces** (not pnpm). npm **12.x** is required: npm 10's dependency
resolver crashes on vitest 4's optional peer graph with
`TypeError: Cannot read properties of null (reading 'edgesOut')` in `@npmcli/arborist`, which
fails `npm install` outright. npm 12 resolves the same tree without flags. (`--legacy-peer-deps`
also works on npm 10, but a clean `npm install` on npm 12 is what the README will state.)

The root `package.json` carries the `workspaces` array; `packages/shared` is consumed by both apps
via the workspace name `@wyxan/shared`.

### 1.4 Configuration

| Variable | Side | Default | Purpose |
| :-- | :-- | :-- | :-- |
| `PORT` | api | `4000` | API + render origin port |
| `MONGODB_URI` | api | `mongodb://localhost:27017/wyxan` | Connection string |
| `WEB_ORIGINS` | api | `http://localhost:3000,http://127.0.0.1:3000` | Allowed `frame-ancestors` / CORS origins |
| `NEXT_PUBLIC_API_BASE` | web | `http://127.0.0.1:4000` | API base URL used by the client |
| `WEB_ORIGIN` | web | `http://localhost:3000` | Origin of the app, for the render iframe |
| `MAX_HTML_BYTES` | api | `65536` | Publish size limit |

### 1.5 Monorepo build notes

Two things about running Next.js 16 inside an npm workspace, both found the hard way and both
one-line fixes in `apps/web/next.config.ts`:

1. **`turbopack.root` must point at the workspace root.** npm hoists `next` to the repository
   root, but Turbopack resolves `next/package.json` relative to the filesystem root it is given,
   which defaults to the app directory (`apps/web`) — where `next` is not installed. The build
   fails with `Could not find the Next.js package (next/package.json)`. The fix is
   `turbopack: { root: path.join(import.meta.dirname, "../..") }`.
2. **`packages/shared` is consumed as a compiled package.** The API imports
   `@small-web-browser/shared` by name; that package's `main` points at `dist/`, so the shared
   package must be built before the API or the web app is. The root scripts chain
   `build:shared` into `dev:api`, `dev:web`, `build`, `seed` and `test` rather than relying on a
   `prepare` lifecycle hook, which fires mid-install and fails the whole install.

---

## 2. Data model

MongoDB via Mongoose. Four collections.

### 2.1 `people`

```ts
{ _id: ObjectId, name: string /* unique */, slug: string }
```

Seeded list of six names. Choosing a name is the whole of identity; there is no password, no
session, no token. The client stores the chosen `personId` in `localStorage`.

### 2.2 `sites`

```ts
{
  _id: ObjectId,
  address: string,        // normalised, UNIQUE — e.g. "tidepool.zz"
  title: string,
  html: string,           // author's HTML, verbatim
  searchText: string,     // derived: title + body text, normalised for indexing
  authorId: ObjectId,     // -> people._id
  publishedAt: Date,
  updatedAt: Date,
  version: number,        // 1 on create (increments only if `replace` ships)
}
```

Indexes:

```js
SiteSchema.index({ address: 1 }, { unique: true });
SiteSchema.index(
  { title: 'text', searchText: 'text' },
  { weights: { title: 10, searchText: 1 }, name: 'site_text' },
);
```

`searchText` is derived once at publish time and never recomputed on read: strip tags, decode
entities, collapse whitespace, lowercase, drop stop words, and apply light suffix folding
(`tides → tide`, `ledgers → ledger`). Deriving at write time keeps the indexed term set stable
and the query path a single indexed lookup.

### 2.3 `visits` — the immutable arrival log

```ts
{
  _id: ObjectId,
  personId: ObjectId,       // -> people._id
  address: string,          // normalised address that was requested
  kind: 'page' | 'notfound' | 'offweb' | 'search',
  title: string,            // resolved title ("Tidepool" / "No such address: …")
  via: 'typed' | 'link' | 'search' | 'publish' | 'history',
  referrerAddress: string | null,
  visitedAt: Date,
  snapshot: {
    title: string,
    html: string | null,        // author HTML for kind==='page'
    query: string | null,       // for kind==='search'
    resultAddresses: string[],  // the addresses a search matched; empty otherwise
    errorCode: string | null,   // 'notfound' | 'offweb'
  },
  pruned: boolean,          // true once dropped from the navigable stack
}
```

Indexes: `{ personId: 1, visitedAt: 1 }`, `{ personId: 1, pruned: 1 }`.

`snapshot` is the mechanism for restore-on-return. It is denormalised into the visit on purpose:
the alternative (re-fetching the site on Back) cannot honour "a page gone back to is the page
that was left". Duplication is cheap at this scale.

### 2.4 `browserStates` — the navigable stack

```ts
{
  _id: ObjectId,
  personId: ObjectId,   // UNIQUE — one stack per person
  entries: ObjectId[],  // ordered visit ids — the navigable history
  cursor: number,       // index into entries
  updatedAt: Date,
}
```

The stack is per **person**, not per session or tab: "history belongs to the name".

### 2.5 Visits vs. the stack — the distinction that makes the brief satisfiable

The brief requires both *"a record of everywhere you have been"* and *"forward can be lost"*.
Those pull in opposite directions if history is a single list. The resolution:

| | `visits` | `browserStates.entries` |
| :-- | :-- | :-- |
| Mutability | Append-only. Never deleted. | Truncatable. |
| Contents | Every arrival the person ever made. | The arrivals still reachable by Back/Forward. |
| Forward loss | Recorded via `pruned: true`. | The entries are removed. |
| Purpose | The permanent record. | The navigation surface. |

Going Back never deletes a Visit; it moves the cursor. Navigating from a mid-stack position
prunes the forward entries (sets `pruned: true`, removes them from `entries`) and appends the new
arrival. The pruned entries stay visible in the history panel, marked as lost — so the reviewer
can *see* forward being lost, which is the whole point.

---

## 3. The history state machine

Lives in `packages/shared/src/history.ts`. Pure, synchronous, no I/O. The API service is a thin
wrapper that persists the result.

```ts
type HistoryEntry = {
  visitId: string; address: string; title: string;
  kind: VisitKind; via: VisitVia; visitedAt: string; pruned: boolean;
};

type HistoryState = { entries: HistoryEntry[]; cursor: number };

// All return a NEW state plus a description of what happened.
push(state, entry):   { state, pruned: HistoryEntry[] }              // navigate: truncate forward, append
back(state):          { state, moved: boolean }                      // cursor - 1, clamp at 0
forward(state):       { state, moved: boolean }                      // cursor + 1, clamp at end
jump(state, index):   { ok: true, state, pruned } | { ok: false, error }

// And the predicates the toolbar needs, so the client does not re-implement them:
canGoBack(state): boolean
canGoForward(state): boolean
currentEntry(state): HistoryEntry | null
```

`jump` is the only one that can refuse: an index outside the stack is a client bug, not an edge
of the stack, so it returns `{ ok: false }` and the API turns that into a `400` (§5.3). The other
three clamp.

### 3.1 Rules

1. **Push truncates forward.** `push` from a cursor that is not at the end removes every entry
   after the cursor and marks them pruned. `Back → Back → navigate` loses two forward entries.
2. **Clamping, not errors.** `back` at index 0 and `forward` at the end are no-ops returning
   `moved: false`. The UI disables the control; the server does not error.
3. **Jump truncates forward.** Jumping to index *i* discards entries *i+1…end*. This is real
   browser behaviour and is required by "forward can be lost". It happens even when *i* is the
   entry you are already on: choosing an entry from the history list is a navigation, and a
   navigation discards the forward entries.
4. **Back and forward do not append.** They move the cursor only. A Visit's `via` and `visitedAt`
   describe the original arrival and never change.
5. **Repeat visits are allowed.** Navigating to the same address twice creates two Visits and two
   stack entries. The history panel may show a "seen before · N times" badge.
6. **The cursor is the position.** `entries[cursor]` is the current page.

### 3.2 Client/server split

The client keeps an authoritative copy of `HistoryState` for instant feedback, and the server
recomputes it from the database on every request that mutates it. The server response returns the
new state; the client replaces its copy. There is one source of truth — the server — and the
client copy exists only so the toolbar can disable Back/Forward without a round trip.

---

## 4. Address normalisation

`packages/shared/src/address.ts` — pure, unit-tested, used by both the client (to preview what
will happen) and the server (which is authoritative).

### 4.1 Algorithm

```
1. Trim whitespace. Reject empty.
2. Reject if it contains whitespace or control characters.
3. If it parses as an absolute URL:
     take scheme-stripped host + path; drop query, fragment, credentials, port.
     If the host is the *app's own* host (`localhost`, or an IP literal), the
     address is the path rather than the host — pasting the page's own URL
     back into the address bar returns the address it was showing.
   Else split on the first "/" → host + path.
4. Lowercase the whole result (the web is case-insensitive).
5. If the host has no dot, append the web root: host + ".zz".
6. Strip a trailing "/" from the path (except the root path).
7. Validate the host: every dot-separated label must match /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.
8. If the host does not end in ".zz" → result is OFF-WEB (kind 'offweb').
9. If the total length exceeds 120 characters → reject as invalid input.
```

### 4.2 Worked examples

| Input | Result | Kind |
| :-- | :-- | :-- |
| `tidepool` | `tidepool.zz` | page |
| `TIDEPOOL.ZZ` | `tidepool.zz` | page |
| `http://tidepool.zz/` | `tidepool.zz` | page |
| `https://tidepool.zz/tide-pools` | `tidepool.zz/tide-pools` | page |
| `tidepool.zz/` | `tidepool.zz` | page |
| `tidepool.zz#section` | `tidepool.zz` | page |
| `http://localhost:3000/tidepool.zz` | `tidepool.zz` | page — pasting an app URL re-enters the address |
| `ghost-reef.zz` | `ghost-reef.zz` | notfound |
| `example.com` | `example.com` | offweb |
| `http://example.com/x` | `example.com/x` | offweb |
| `` / `   ` | — | invalid (rejected inline, no navigation, no Visit) |
| `tide pool` | — | invalid |

**The Kind column is the *resolved* kind, not the syntactic one.** Normalisation and resolution
are separate steps, because only one of them is a pure function:

- `normalizeAddress(input)` answers *"is this well-formed, what is its canonical spelling, and is
  it inside the web?"* → `{ ok: true, address, inWeb }` or `{ ok: false, error }`. It never
  consults the database, so it cannot know that `ghost-reef.zz` has no site behind it.
- `resolveKind(address, siteExists)` answers *"what did arriving here produce?"* →
  `'page' | 'notfound' | 'offweb'`. The caller supplies `siteExists` from the lookup.

Keeping them apart is what lets the browser preview a navigation without a round trip, and it is
why the two failures stay distinct: a well-formed address with no site is `notfound`, an address
outside `*.zz` is `offweb`, and the brief wants those to be two different pages, not one.

### 4.3 Addresses with paths

A Site's address may carry a path (`tidepool.zz/tide-pools`). The seed corpus uses flat
addresses for readability; the model supports paths without special-casing. A path address is a
distinct address — it does not resolve to its host.

---

## 5. API contract

Base URL `http://127.0.0.1:4000`. All request and response bodies are JSON unless noted.
Errors use NestJS's standard shape: `{ statusCode, message, error }`.

### 5.1 Endpoints

| Method | Path | Body / Query | Returns |
| :-- | :-- | :-- | :-- |
| GET | `/api/health` | — | `{ ok, db, version, uptime }` |
| GET | `/api/people` | — | `[{ id, name }]` |
| GET | `/api/sites/:address` | — | `{ address, title, author, publishedAt, version }` · 404 |
| POST | `/api/sites` | `{ address, title, html, authorId, replace? }` | `201 { address, title, version, publishedAt }` · 400 · 409 |
| GET | `/api/search` | `?q=&limit=20&offset=0` | `{ query, total, results: [{ address, title, snippet, score }] }` |
| GET | `/api/history` | `?personId=` | `{ personId, cursor, canGoBack, canGoForward, entries: [...], totalVisits, lostCount }` |
| POST | `/api/visits` | `{ personId, address, via, referrerAddress? }` | `201 { visit, state }` |
| POST | `/api/history/back` | `{ personId }` | `200 { visit, state }` · `204` (no move) |
| POST | `/api/history/forward` | `{ personId }` | `200 { visit, state }` · `204` (no move) |
| POST | `/api/history/jump` | `{ personId, index }` | `200 { visit, state, pruned: [...] }` |
| GET | `/render/:visitId` | — | `text/html` — the sandboxed document |

`state` is the serialised `HistoryState` (entries + cursor) so the client never has to
reconstruct it.

### 5.2 `POST /api/visits` — the navigation endpoint

Request: `{ personId, address, via, referrerAddress? }`

`address` arrives already normalised from the client, but the server **re-normalises and
re-validates** — the client is not trusted.

Server behaviour:

1. Normalise the address. If invalid → `400 { message: 'That is not an address this web can hold.' }`.
2. Resolve:
   - host not in `*.zz` → `kind: 'offweb'`, snapshot is our own error page.
   - host in `*.zz`, no site → `kind: 'notfound'`, snapshot is our own error page.
   - host in `*.zz`, site exists → `kind: 'page'`, snapshot holds the author HTML.
3. Create the Visit with `visitedAt = now`, `via`, `referrerAddress`.
4. Apply `push` to the person's `browserStates` — truncating any forward entries.
5. Persist the Visit, the pruned flags, and the new stack.
6. Return `{ visit, state }`.

### 5.3 Back / forward / jump

All three load the person's `browserStates`, apply the corresponding pure state-machine
transition, persist, and return the visit now under the cursor.

- `back` at cursor 0 → `204 No Content`, no state change.
- `forward` with cursor at the end → `204 No Content`.
- `jump` with an out-of-range index → `400`.

`jump` returns the entries it pruned so the client can animate/announce the loss.

### 5.4 `POST /api/sites` — publish

Validation order:

1. `address` present and normalises to a valid in-web address → else `400`.
2. `title` non-empty, ≤ 200 chars → else `400`.
3. `html` present, ≤ `MAX_HTML_BYTES` (64 KiB) → else `400` with the limit stated.
4. `authorId` must reference a seeded person → else `400`.
5. Address already taken → `409 { message, suggestion }` where `suggestion` is
   `<slug>-2.zz` style, or the nearest free address.

On success: store `html` verbatim, derive `searchText`, set `publishedAt = now`, `version = 1`.
With `replace: true` (stretch) and an existing address, the site document is updated and
`version` incremented — the previous version survives only inside the snapshots of visits that
already saw it.

### 5.5 `GET /api/search`

Query: `q` (required, ≤ 200 chars), `limit` (≤ 50, default 20), `offset` (default 0).

Implementation — a single aggregation pipeline:

```js
[
  { $match: { $text: { $search: q } } },
  { $addFields: { score: { $meta: 'textScore' } } },
  { $addFields: { titleExact: { $cond: [{ $eq: ['$title', q] }, 1000, 0] } } },
  { $sort: { titleExact: -1, score: -1, address: 1 } },   // deterministic tie-break
  { $skip: offset },
  { $limit: limit },
  { $project: { address: 1, title: 1, score: 1, searchText: 1, _id: 0 } },
]
```

`total` comes from a parallel `$count` stage in the same pipeline.

Snippets are produced in the service from `searchText` (first occurrence of a query term, ±60
characters, whitespace-collapsed), not by a MongoDB projection, so snippet rules stay in
application code and are unit-testable.

**Documented limitations** (to be stated in the walkthrough, not hidden): MongoDB's built-in text
index applies its default English stemmer and stop-word list; it offers no fuzzy matching, no
autocomplete, no synonym support, and permits only one text index per collection. For a
12-page corpus this is the right trade-off — it needs no extra service. If the corpus grew
materially, Atlas Search (BM25) or Meilisearch would be the upgrade path.

### 5.6 `GET /render/:visitId` — the sandboxed document

Returns the **stored snapshot**, never the live site.

Response headers:

```
Content-Type: text/html; charset=utf-8
Content-Security-Policy: sandbox allow-scripts; default-src 'none'; style-src 'unsafe-inline';
  img-src data: blob:; font-src data:; base-uri 'none'; form-action 'none';
  frame-ancestors http://localhost:3000 http://127.0.0.1:3000
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Cache-Control: no-store
```

Body:

- `kind === 'page'` → the author's HTML, with **one** injected script (the link bridge, §6.3)
  immediately before `</body>`.
- `kind === 'notfound'` → our own "No such address" page, with the requested address HTML-escaped.
- `kind === 'offweb'` → our own "That address is not part of this web" page.
- `kind === 'search'` → not served here; the client renders the results panel natively.

`frame-ancestors` is built from `WEB_ORIGINS` so the app can frame the page and nothing else can.

---

## 6. Frontend specification

### 6.1 The shell

`apps/web/app/page.tsx` is a client component that renders:

```
┌───────────────────────────────────────────────────────────────┐
│ [◀] [▶] [⟳]  [ address bar ................. ] [ 🔍 search ]  │
│ [☰ History] [✎ Publish]                       Browsing as ▾   │
├──────────────────────────────────────────────┬────────────────┤
│                                              │  HISTORY       │
│              viewport                        │  ▸ item        │
│                                              │  ▸ item        │
│                                              │  ▸ item (lost) │
│                                              │                │
└──────────────────────────────────────────────┴────────────────┘
```

- The history panel is a right-hand drawer, collapsible. It is also openable as a full view.
- The viewport is either the sandboxed `<iframe>` or, for a search result, the React results panel.
- There is **no page reload** between navigations. The browser is an SPA; the address bar is a
  control, not a location.

### 6.2 Navigation flow

```
user submits address
  → client normalises (packages/shared) for instant feedback
  → POST /api/visits { personId, address, via, referrerAddress }
  → server re-normalises, resolves, snapshots, appends the Visit, truncates forward
  → client replaces its HistoryState with the returned state
  → viewport renders visit.snapshot (iframe src = /render/:visitId, keyed by visitId)
```

Back / forward / jump follow the same shape, calling the history endpoints and re-rendering the
returned visit. **Back never re-fetches a site** — it renders the stored snapshot, which is what
makes restore-on-return exact.

The iframe is keyed by `visitId` so that revisiting the same address produces a fresh frame
rather than a cached one, and so that going back to an earlier arrival of the same address shows
the earlier snapshot.

### 6.3 Link bridge — how links work inside a sandboxed page

A sandboxed frame cannot navigate the top window. So the render endpoint injects exactly one
script of ours, as the last element in the document:

```html
<script id="wyxan-bridge">
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    var url;
    try { url = new URL(href, location.href); } catch (err) { return; }
    e.preventDefault();
    parent.postMessage({ type: 'wyxan:navigate', href: url.href }, '*');
  }, true);
</script>
```

The parent receives the message and validates it before acting:

- The message source must be the current iframe (`event.source === iframeRef.current.contentWindow`).
  The frame has an **opaque origin**, so origin-checking is not possible; source-checking is the
  correct control.
- The URL is re-normalised by the shared library. Only in-web addresses are navigable; anything
  else is treated as off-web.

**Cost and honesty.** We inject one script into the author's page; everything else is verbatim.
The author's own scripts still run, but they cannot remove the bridge (capture-phase listener on
`document`), and even if they did, the worst case is a link that does nothing — never an escape.
The bridge is the only thing we add to author HTML, and we say so on screen in the walkthrough.

### 6.4 Containment layers

| Layer | Mechanism | What it blocks |
| :-- | :-- | :-- |
| 1. Origin split | App on `localhost:3000`, pages on `127.0.0.1:4000` | Cookies, storage, DOM, `postMessage` reach into the app |
| 2. `iframe sandbox="allow-scripts"` | No `allow-same-origin` → opaque origin; no `allow-forms`, `allow-popups`, `allow-top-navigation` | Top-level navigation, form submission, popups, same-origin access |
| 3. `Content-Security-Policy: sandbox allow-scripts` on the served document | Sandbox applies even if the URL is opened directly in a tab | Direct navigation to the render URL |
| 4. `default-src 'none'` | Nothing may be fetched | Remote images, fonts, scripts, beacons, exfiltration |
| 5. `base-uri 'none'` | `<base>` ignored | Link-resolution hijacking |
| 6. `frame-ancestors <app origins>` | Only the app may frame it | Clickjacking / framing by other sites |
| 7. `nosniff`, `Referrer-Policy: no-referrer` | — | MIME sniffing, referrer leakage |

**What authors lose, stated plainly:** JavaScript still runs, but with no `localStorage`, no
cookies, no `fetch` to our API, no form submission, no popups, no top-level navigation, and no
outbound network at all. Author pages are, in effect, offline documents. That is the deliberate
trade for making "anyone can publish" safe.

### 6.5 Search UI

- A dedicated search box in the toolbar, separate from the address bar.
- Submitting a search creates a `kind: 'search'` arrival with the pseudo-address
  `search:<query>` — it occupies a history slot, so Back returns to the results.
- Results render natively in the viewport (not in an iframe): title, address, snippet, and a
  "via" line. Clicking a result navigates to that address with `via: 'search'`.
- An empty result set shows an honest empty state.
- The query is echoed in the address bar as `search:<query>` while results are displayed.

### 6.6 Publish UI

- Modal panel: address, title, HTML source, and a **live preview** rendered in a
  `<iframe sandbox="allow-scripts">` from a `srcdoc` blob — an opaque origin, no network.
- On submit: `POST /api/sites`. On `409`, the conflict and the suggestion are shown inline.
- On success, the browser navigates to the new address with `via: 'publish'`, and the new page
  appears in history.

### 6.7 Person picker

A dropdown of the seeded people. The selection is stored in `localStorage` and sent as `personId`.
Changing person reloads the history panel for that person; the currently displayed page stays on
screen.

### 6.8 Accessibility

Every control is a real `<button>`/`<input>` with an accessible name; the address bar is a
single-line text field with a submit action on Enter; history entries are buttons in a list;
visible focus rings; `aria-current` marks the active history entry; the viewport iframe carries a
`title`; the results panel is a list with headings.

---

## 7. Seed specification

`npm run seed` (from `apps/api`): `node dist/scripts/seed.js [--reset]`.

The root `npm run seed` builds `packages/shared` and the API first, then runs that script — the
seed needs `dist/` to exist, so a bare `node dist/scripts/seed.js` on a clean checkout fails.
`npm run seed -- --reset` rebuilds the web from nothing.

### 7.1 Determinism

- Every seeded document gets a **deterministic `_id`**: `new ObjectId(sha1(key).slice(0, 24))`.
- Insertion uses `bulkWrite` with `updateOne: { _id }` + `$setOnInsert` + `upsert: true`.
- Consequence: running the seed twice changes nothing — the web does not double.
- `--reset` deletes the four collections first, for a clean rebuild.
- Timestamps are fixed constants derived from a base epoch, with fixed offsets — never `now()`.
  The same command produces the same history at the same times.

### 7.2 Content

**Six people:** Ada, Bram, Cleo, Dev, Esme, Fay.

**Twelve sites**, all with real prose (100–250 words of plausible writing, not filler):

| Address | Title | Author |
| :-- | :-- | :-- |
| `tidepool.zz` | Tidepool | Ada |
| `gull-counts.zz` | Gull Counts | Ada |
| `the-tiny-internet.zz` | The Tiny Internet | Ada |
| `kelp-forest.zz` | Kelp Forest | Bram |
| `saltmarsh-almanac.zz` | Saltmarsh Almanac | Bram |
| `hermit-crabs.zz` | Hermit Crabs | Cleo |
| `shell-phonebook.zz` | Shell Phonebook | Cleo |
| `otter-ledger.zz` | Otter Ledger | Dev |
| `anchorite.zz` | Anchorite | Dev |
| `moon-ledger.zz` | Moon Ledger | Esme |
| `low-tide-almanac.zz` | Low Tide Almanac | Esme |
| `dust-and-salt.zz` | Dust and Salt | Fay |

(The exact split of authors across sites is a seed detail, not a contract; the requirement is that
"a couple of authors" own more than one site.)

**Link graph.** Sites link to each other so that a trail four deep exists without turning back,
and at least three links point at addresses that never existed: `ghost-reef.zz`,
`the-lost-lighthouse.zz`, `drowned-forest.zz`, `nowhere-in-particular.zz`.

**Search discrimination.** Seed prose deliberately contains distinguishing vocabulary — "ledger",
"almanac", "kelp", "hermit", "barnacle", "tide" — so that a query returns a handful of pages
rather than everything. Fixture queries in the test suite assert this.

**Browsing history.** Roughly an hour of arrivals across four of the six people:

- Repeat visits to the same address (at least three addresses revisited).
- One or two long trails (12+ arrivals deep).
- At least one person who has been nearly everywhere (10+ of the 12 sites).
- Arrivals whose `via` covers typed, link, search and publish, so the history list shows variety.
- The permanent visit log and the navigable stack both seeded, with **one deliberately truncated
  forward stack** so the "lost forward entries" state is visible on first launch.

---

## 8. Testing strategy

Correctness evidence is the deliverable. Three layers.

### 8.1 Unit — `packages/shared` and pure services

Both packages run **vitest** (the runner the NestJS 12 scaffold ships). The root `npm test` runs
`packages/shared` first, then `apps/api`; `packages/shared` is built before both, because the API
imports the compiled workspace package.

- `address.test.ts` — every row of the §4.2 table, plus invalid inputs.
- `history.test.ts` — every transition:
  - push at the end appends;
  - push mid-stack truncates forward and reports the pruned entries;
  - back at 0 is a no-op; forward at the end is a no-op;
  - jump truncates forward;
  - back/forward never append an entry;
  - repeat visits are allowed and produce distinct entries.
- `searchText.test.ts` — tag stripping, entity decoding, whitespace collapsing, suffix folding.

### 8.2 Integration — API against a real MongoDB (`mongodb-memory-server`)

The API's integration tests run under vitest with `mongodb-memory-server`, so no running MongoDB
is required for `npm test`; the Dockerised `mongo:8` is for the app itself and the seed.

- Publish → address is taken → 409 on a second publish with a suggestion.
- Publish → the text of the page is findable via search.
- Navigate → Back → the snapshot returned is the one from the original arrival, even after the
  site has been replaced.
- Navigate → Back → navigate again → forward returns `204` and the forward entries are pruned.
- Jump to an older entry → forward entries pruned, cursor correct.
- Visit a non-existent address → `kind: 'notfound'` → the render endpoint returns the 404 page.
- Visiting an off-web host → `kind: 'offweb'` → a distinct error page.
- The seed command run twice → collection counts unchanged.

### 8.3 End-to-end — Playwright (stretch; cut first if time is short)

One spec per capability: type an address; follow a link; back/forward; jump in history; search and
return to results; publish and browse the new page; reach an address that leads nowhere.

### 8.4 Manual verification script

A short checklist the reviewer can run by hand, embedded in the README and narrated in the
recording.

---

## 9. Run commands

```bash
# 0. prerequisites: Node 22+ (24 LTS), npm 12+, Docker
npm i -g npm@12            # npm 10's resolver crashes on vitest 4's peer graph
git clone <repo> && cd wyxan
npm install

# 1. database
docker compose up -d mongo

# 2. seed the web  (idempotent; add -- --reset to rebuild)
npm run seed
npm run seed -- --reset    # rebuild the web from nothing

# 3. run both sides (two terminals)
npm run dev:api      # http://127.0.0.1:4000
npm run dev:web      # http://localhost:3000

# 4. tests
npm test             # unit + integration
npm run test:e2e     # optional Playwright

# stop the database
docker compose down
```

Root `package.json` scripts:

```json
{
  "build:shared": "npm --workspace packages/shared run build",
  "dev:api": "npm run build:shared && npm --workspace apps/api run start:dev",
  "dev:web": "npm run build:shared && npm --workspace apps/web run dev",
  "build": "npm run build:shared && npm --workspace apps/api run build && npm --workspace apps/web run build",
  "seed": "npm run build:shared && npm --workspace apps/api run build && npm --workspace apps/api run seed --",
  "test": "npm run build:shared && npm --workspace packages/shared run test && npm --workspace apps/api run test"
}
```

`build:shared` is chained into every entry point on purpose: `packages/shared` is consumed as a
compiled ESM package, and a `prepare` lifecycle hook on a workspace package fails the install
mid-flight. An explicit script is predictable.

---

## 10. API response shapes (reference)

```ts
type VisitKind = 'page' | 'notfound' | 'offweb' | 'search';
type VisitVia = 'typed' | 'link' | 'search' | 'publish' | 'history';

type HistoryEntryDto = {
  visitId: string; address: string; title: string;
  kind: VisitKind; via: VisitVia; visitedAt: string; pruned: boolean;
};

type HistoryStateDto = {
  personId: string;
  entries: HistoryEntryDto[];
  cursor: number;
  canGoBack: boolean;
  canGoForward: boolean;
};

type VisitDto = {
  visitId: string; address: string; kind: VisitKind; title: string;
  via: VisitVia; referrerAddress: string | null; visitedAt: string;
  renderUrl: string;             // absolute URL to /render/:visitId
  snapshot: { title: string; html: string | null; query: string | null;
              resultAddresses: string[] | null; errorCode: string | null };
};

type SearchResultDto = {
  address: string; title: string; snippet: string; score: number;
};
```

---

## 11. Open technical questions

1. **Is `replace` worth the complexity?** It adds a version counter and a demo for restore-on-
   return. Default: cut unless time allows (it is the strongest demo of the snapshot model).
2. **Should scroll position be restored on Back?** Real browsers do. Default: cut; the snapshot
   already restores the *content*.
3. **Should search results be a `kind` on `visits`, or a separate collection?** Default: a kind on
   `visits` — one uniform arrival log, one uniform history stack.
4. **Should the API expose a `GET /api/sites` listing?** Not required; the history and search
   surfaces cover discovery. Default: no.
