# PLAN — Wyxan: The Small Web and the Browser You Read It In

**Status:** Draft for review · **Companions:** `PRD.MD`, `SPEC.MD`
**Budget:** ~8 focused hours across 3 calendar days
**Method:** build in vertical slices, each ending in a runnable commit; prove correctness with
tests as the behaviour is written, not afterwards.

---

## 1. Strategy

### 1.1 Order of work

The build is ordered so that the **non-negotiables land first and stay provable**:

1. **Address rules and the history state machine first**, as pure functions in
   `packages/shared`, with unit tests written alongside. Everything else depends on these two
   being right, and both are cheap to test exhaustively.
2. **Then the data model and the API** — sites, visits, browser state, search, render.
3. **Then the browser shell** — the client is a thin consumer of a state machine the server owns.
4. **Then containment hardening, seed content, and the recording.**

Rationale: the risk in this project is not "can I build a Next.js app", it is "is back/forward
provably right, and can author HTML escape". Both risks live in the first two days. The UI is
the part that is merely work.

### 1.2 Rules for the whole build

- **Commit per slice.** No commit contains more than one concern; the history must read as a
  narrative. Never a single "initial commit" dump.
- **No silent stubs.** If something is not built, the endpoint does not exist and the README says
  so. No `TODO` in a shipped path.
- **No unbounded scope.** The cut-list in `PRD.MD` §9 is agreed before Day 1 and honoured.
- **Every judgement call gets a line in the README** under "Decisions", so the walkthrough can
  point at it.

### 1.3 Definition of done for the whole project

- `npm install && docker compose up -d mongo && npm run seed` shows a browsable small web, with
  `npm run dev:api` and `npm run dev:web` in two terminals. (npm **12** required — see SPEC
  §1.3.3.)
- `npm test` is green.
- Back, forward, forward-loss, restore-on-return, history jump, search, and publish are each
  demonstrated in a test **and** in the recording.
- The containment headers are visible in a screenshot or `curl` output in the recording.

---

## 2. Time budget

| Day | Focus | Hours | Ends with |
| :-- | :-- | :-- | :-- |
| 1 | Foundations: monorepo, schema, addresses, sites, visits | ~3h | API that can publish a site and record an arrival |
| 2 | History semantics, search, render endpoint, the browser shell | ~3h | A browser you can navigate, go back, and search in |
| 3 | Containment, publish UI, seed content, tests, polish, recording | ~2h + ~1h recording | A submission that can be walked again |

### Day 1 (~3h)

| # | Task | Est. | Notes |
| :-- | :-- | :-- | :-- |
| 1.1 | Init npm 12 workspaces repo; git init; `.gitignore`, `.editorconfig`, oxlint/prettier, TS strict config | 20m | `apps/web`, `apps/api`, `packages/shared` skeletons — ESM everywhere, TS per SPEC §1.3.2 |
| 1.2 | `packages/shared`: types, `normalizeAddress` (+ tests), `history` state machine (+ tests) | 35m | Pure functions. Tests written in the same commit as the code. |
| 1.3 | `docker-compose.yml` (mongo:8, volume, healthcheck); Mongoose module + connection | 15m | `MONGODB_URI` from env |
| 1.4 | Schemas: `people`, `sites` (+ unique address index, text index), `visits`, `browserStates` | 30m | Indexes declared on the schema, not applied by hand |
| 1.5 | `PeopleModule`: `GET /api/people` | 10m | |
| 1.6 | `SitesModule`: publish (`POST /api/sites`) with validation + `searchText` derivation; `GET /api/sites/:address` | 40m | Validation order per SPEC §5.4 |
| 1.7 | `VisitsModule`: resolve address → kind + snapshot; `POST /api/visits`; apply `push` to the person's stack | 40m | Snapshot capture lives here |
| 1.8 | End-of-day commit sweep; make `npm run dev:api` boot cleanly | 10m | |

**Day 1 checkpoint:** publish a site via `curl`, navigate to it via `curl`, and confirm a Visit
and a `browserStates` document exist with the right shape.

### Day 2 (~3h)

| # | Task | Est. | Notes |
| :-- | :-- | :-- | :-- |
| 2.1 | `HistoryModule`: `GET /api/history`, `/back`, `/forward`, `/jump`; persist the stack; prune flags | 45m | Back/forward never append; jump truncates forward |
| 2.2 | `SearchModule`: text index query, title boost, deterministic sort, snippet builder (+ unit tests) | 40m | One aggregation pipeline |
| 2.3 | `RenderModule`: `GET /render/:visitId`, CSP + sandbox + frame-ancestors headers, 404/offweb pages, link-bridge injection | 40m | Headers first, body second |
| 2.4 | Next.js shell: layout, globals, toolbar, address bar, viewport, API client, state reducer | 45m | `useReducer` over the server's state |
| 2.5 | Wire navigation: type → visit → render; Back/Forward buttons → history endpoints | 30m | Buttons disabled from `canGoBack`/`canGoForward` |
| 2.6 | History drawer: scrollable list, current marker, jump, lost-entry styling | 25m | |
| 2.7 | End-of-day: `npm test` green for shared + api | 15m | |

**Day 2 checkpoint:** a browser that navigates, goes back and forward, loses forward correctly,
and shows a history list.

### Day 3 (~2h + recording)

| # | Task | Est. | Notes |
| :-- | :-- | :-- | :-- |
| 3.1 | Containment pass: verify every header, verify the origin split, hostile-HTML smoke test (script tag, iframe, form, base tag, remote image) | 30m | Write the hostile page; confirm it cannot escape |
| 3.2 | Link bridge end-to-end: click a link inside a published page → navigates | 25m | The one injection we accept |
| 3.3 | Search panel + results-as-a-history-entry + return-to-results | 25m | |
| 3.4 | Publish panel + live preview + conflict handling | 25m | |
| 3.5 | Seed: write the twelve sites' prose, the link graph, and the browsing history | 45m | The prose is the slow part — budget for it |
| 3.6 | Seed command: deterministic ids, upserts, `--reset`; integration test that two runs are identical | 25m | |
| 3.7 | Integration test suite per SPEC §8.2 | 45m | |
| 3.8 | README: run commands, decisions, manual verification checklist | 20m | |
| 3.9 | Commit sweep, tag `v1.0.0` | 10m | |
| 3.10 | **Record the walkthrough** | ~60m | Script in §6 below |

**Total focused build: ~8h. Recording: ~1h, outside the stated budget.**

---

## 3. Commit plan

Each commit is one concern and leaves the repo in a working state. The resulting `git log` is
itself part of the deliverable.

| # | Commit message | Day | Why it is a separate commit |
| :-- | :-- | :-- | :-- |
| 1 | `chore: scaffold npm 12 workspaces monorepo with next.js 16, nestjs 12 (esm) and shared package` | 1 | Reviewer sees the shape of the repo first |
| 2 | `feat(shared): address normalisation rules with unit tests` | 1 | The rules are a contract; they get reviewed alone |
| 3 | `feat(shared): browser history state machine with unit tests` | 1 | The core of the assessment, isolated and provable |
| 4 | `feat(api): mongo connection and schemas for people, sites, visits and browser states` | 1 | Data model is reviewable on its own |
| 5 | `feat(api): publish a site with validation and derived search text` | 1 | |
| 6 | `feat(api): record arrivals with content snapshots` | 1 | Snapshot = restore-on-return |
| 7 | `feat(api): back, forward, jump and forward-stack truncation` | 1 | The non-negotiable, isolated |
| 8 | `feat(api): full-text search across titles and page bodies` | 2 | |
| 9 | `feat(api): serve snapshots from a sandboxed render endpoint` | 2 | Containment, reviewable on its own |
| 10 | `feat(web): browser shell with address bar and sandboxed viewport` | 2 | |
| 11 | `feat(web): history drawer with jump and lost-entry states` | 2 | |
| 12 | `feat(web): search panel with results as a history entry` | 2 | |
| 13 | `feat(web): publish panel with live preview and conflict handling` | 3 | |
| 14 | `feat(web): link bridge for navigation inside published pages` | 3 | The one injection; called out separately on purpose |
| 15 | `feat(seed): deterministic seed command with twelve sites and an hour of history` | 3 | |
| 16 | `test(api): integration coverage for navigation, restoration, truncation and search` | 3 | Proof, collected into its own commit |
| 17 | `docs: readme with run commands, decisions and verification checklist` | 3 | |

If the schedule slips, commits 12–14 are merged into 10 and 13 into 10; the history story is
preserved.

---

## 4. Task checklist

### 4.1 Foundations

- [ ] npm 12 workspaces root; `packages/shared` builds to ESM + types
- [ ] `apps/api` on NestJS 12 in **ESM** (`"type": "module"`, `module: nodenext`), port 4000, CORS
      restricted to `WEB_ORIGINS`
- [ ] `apps/web` on Next.js 16 App Router, port 3000
- [ ] TypeScript strict mode everywhere; no `any` in `packages/shared`
- [ ] TypeScript **6.0.3** in `apps/api`, **7.0.2** in `packages/shared` and `apps/web` (SPEC §1.3.2)
- [ ] oxlint + Prettier; `npm run lint` clean
- [ ] `docker-compose.yml`: mongo:8, named volume, healthcheck
- [ ] `.env.example` documenting every variable from SPEC §1.4

### 4.2 Shared package

- [ ] `normalizeAddress(input): { ok: true, address, kind } | { ok: false, error }`
- [ ] `isInWeb(address): boolean`
- [ ] `history` state machine: `push`, `back`, `forward`, `jump` — all pure, all returning new state
- [ ] `history` unit tests covering every rule in SPEC §3.1
- [ ] `address` unit tests covering every row of SPEC §4.2
- [ ] Shared DTO types matching SPEC §10

### 4.3 API

- [ ] Mongoose schemas with declared indexes (unique address, text index, person+time)
- [ ] `GET /api/health`, `GET /api/people`
- [ ] `POST /api/sites` — validation order, conflict + suggestion, `searchText` derivation
- [ ] `GET /api/sites/:address`
- [ ] `POST /api/visits` — normalise, resolve kind, snapshot, push, persist
- [ ] `GET /api/history`, `POST /api/history/{back,forward,jump}`
- [ ] `GET /api/search` — pipeline, title boost, deterministic tie-break, snippets
- [ ] `GET /render/:visitId` — headers first, then body; 404/offweb pages; bridge injection
- [ ] Structured logs for publish, navigate, back/forward/jump, search
- [ ] Error shape consistent: `{ statusCode, message, error }`

### 4.4 Web

- [ ] Shell layout: toolbar, address bar, search box, history drawer, viewport
- [ ] Person picker persisted in `localStorage`
- [ ] Address bar: Enter to navigate, inline validation errors, no navigation on invalid input
- [ ] Viewport: iframe keyed by `visitId`; results panel for `kind: 'search'`
- [ ] Back / Forward buttons, disabled at the boundaries, driven by `canGoBack`/`canGoForward`
- [ ] History drawer: scrollable, current marked (`aria-current`), click to jump, lost entries styled
- [ ] Search panel: query echo, results, click to navigate, empty state
- [ ] Publish panel: address/title/HTML, live preview in a sandboxed `srcdoc` frame, conflict display
- [ ] Keyboard operable throughout; visible focus; accessible names

### 4.5 Containment (verified, not assumed)

- [ ] App origin `localhost:3000`; page origin `127.0.0.1:4000`
- [ ] `iframe sandbox="allow-scripts"` — no `allow-same-origin`, no `allow-forms`, no `allow-top-navigation`
- [ ] `Content-Security-Policy: sandbox allow-scripts; default-src 'none'; …` on `/render/:visitId`
- [ ] `frame-ancestors` limited to `WEB_ORIGINS`
- [ ] `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`
- [ ] `base-uri 'none'` — `<base>` in author HTML cannot hijack link resolution
- [ ] Hostile-HTML smoke test published and inspected: `<script>`, `<iframe>`, `<form>`, `<base>`,
      remote `<img>`, `javascript:` href, `onerror=` handler — none escape
- [ ] Direct navigation to `/render/:visitId` in a tab is still sandboxed (CSP header)
- [ ] `postMessage` handler validates `event.source` against the iframe ref

### 4.6 Seed

- [ ] Six people; twelve sites with real prose; four people with an hour of history
- [ ] Link graph supports a trail four deep; ≥ 3 links to addresses that never existed
- [ ] Repeat visits, long trails, one near-complete trail
- [ ] One deliberately truncated forward stack so lost entries are visible on first launch
- [ ] Deterministic `_id`s; upserts; `--reset`; identical output across runs
- [ ] Integration test: two runs → identical counts

### 4.7 Tests & docs

- [ ] Unit (vitest): address, history, search text, snippets
- [ ] Integration (vitest + `mongodb-memory-server`): publish, search, navigate, back,
      forward-loss, jump, restore-after-replace, notfound, offweb, seed idempotency
- [ ] README: the commands from SPEC §9, plus "Decisions" and a manual verification checklist
- [ ] No TODOs in shipped paths; no stubbed endpoints

---

## 5. Risk register (build-time)

| Risk | Trigger to watch | Response |
| :-- | :-- | :-- |
| Toolchain drift | `npm install` crashes, or `nest build` refuses the TypeScript version | Follow SPEC §1.3 exactly: npm 12, ESM everywhere, TS 6.0.3 for the API. The matrix is verified end to end; do not re-pin versions mid-build. |
| History semantics drift | "I can go back but the stack looks wrong" | Stop UI work; fix the shared state machine and its tests first. The machine is the contract. |
| Snapshots too large | Visit documents exceed expectations | Truncate stored HTML to a cap (e.g. 64 KiB) at publish time — the same cap as `MAX_HTML_BYTES`. Already bounded. |
| MongoDB text index surprises | A query returns nothing for a word plainly in the body | Check `searchText` derivation (entities, tags) before touching the index; the bug is almost always in derivation. |
| `frame-ancestors` blocks the app | Viewport shows a blank frame | Add the reviewer-facing origin to `WEB_ORIGINS`; both `localhost` and `127.0.0.1` are default. |
| NestJS 12 / Next.js 16 friction | Scaffold fights the default config | Keep the scaffolds as they ship (Nest 12 is ESM; Next 16 uses Turbopack) and change only what the platform forces: `"type": "module"` + `nodenext` for the API. Avoid unnecessary config surgery. |
| Seed prose takes too long | 3.5 running long | Write 6 strong sites and 6 short ones; quality of 6 beats quantity of 12. |
| Recording overruns | Rehearsal > 60 min | Rehearse the script once before recording; cut the introduction, never the forward-loss demo. |

---

## 6. Walkthrough script

Four to five minutes. Voice-over throughout; a silent capture is half a submission. The script
must cover: **a trail four deep; back and forward across it; a search and a return to its
results; a publish; an address that leads nowhere** — and explain **the model chosen, how
back and forward are made to hold, how the HTML you did not write is contained, and what was
knowingly left out.**

| # | Time | On screen | Voice-over |
| :-- | :-- | :-- | :-- |
| 1 | 0:00–0:25 | The browser shell, seeded history visible | What this is: a small web in a database and a browser that reads it. Three decisions shape everything: the history model, the snapshot, and the origin split. |
| 2 | 0:25–1:15 | Type `tidepool` → land on the page → click through to `kelp-forest` → `hermit-crabs` → `shell-phonebook` | A trail four deep. Every arrival is recorded with how you got there and a copy of what you saw. |
| 3 | 1:15–2:00 | Back ×2, then Forward ×1, then Back again | Back and forward move a cursor over an immutable arrival log — they never create a new arrival. Here is forward being lost: go back two, then type a new address. Forward is gone, exactly like a real browser. The entries are not deleted, only marked lost. |
| 4 | 2:00–2:35 | Open the history drawer, scroll, jump to an older entry | History belongs to the name, not the tab. Scrollable, jumpable, and jumping also discards forward. |
| 5 | 2:35–3:05 | Search "ledger" → results → click one → Back | Search reads the body, not just the title, and ranks titles first. The results are a history entry, so Back brings them back. |
| 6 | 3:05–3:30 | Publish `my-first-site.zz` with HTML → land on it | Anyone can publish. The address is taken, the text becomes searchable immediately. |
| 7 | 3:30–3:50 | Type `ghost-reef.zz` → the "no such address" page | An address that leads nowhere is still a real arrival, recorded in history, and restorable as such. |
| 8 | 3:50–4:30 | Split screen / `curl -I` of `/render/:visitId` showing the CSP headers | **Containment:** author HTML never enters the app's DOM. It is served from a different origin, inside a sandboxed frame with no same-origin access, under `default-src 'none'` so it cannot phone home. The cost, stated plainly: authors keep JavaScript but lose storage, cookies, forms and any outbound request. Here is the header that does it. |
| 9 | 4:30–4:50 | README on screen, run commands | **What was knowingly left out:** no auth, no tabs, no edits, no assets, no real network; search has no fuzzy matching; scroll position is not restored. And the run commands. |

**Rehearsal note:** rehearse once end-to-end before recording. Seed is deterministic, so the
exact trail in step 2 exists on every fresh seed — the walk can be walked again.

---

## 7. Deliverables checklist

- [ ] Git repository with the 17-commit history above (or an equivalent narrative)
- [ ] `npm run seed` — deterministic, idempotent, `--reset` supported
- [ ] README with the run commands and nothing else in the way
- [ ] `PRD.MD`, `SPEC.MD`, `PLAN.MD` committed at the repo root
- [ ] Narrated screen recording, 4–5 minutes, covering the six required beats
- [ ] Tests green: unit + integration
- [ ] `curl -I http://127.0.0.1:4000/render/<id>` shows the containment headers

---

## 8. Next steps

1. Install the toolchain: Node 22+ (24 LTS), **npm 12** (`npm i -g npm@12`), Docker.
2. Review `PRD.MD`, `SPEC.MD`, `PLAN.MD`; confirm the judgement calls in PRD §3.3 and the open
   questions in PRD §10.
3. Switch to the build agent.
4. Copy the three documents into the repo root as the first commit, then execute §2 in order.
5. Checkpoint at the end of Day 1 and Day 2 before continuing.
