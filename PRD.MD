# PRD — Wyxan: The Small Web and the Browser You Read It In

**Status:** Draft for review · **Stack:** Next.js · NestJS · MongoDB · TypeScript
**Budget:** ~8 focused hours across 3 calendar days
**Source brief:** `Wyxan-FullStack-Technical-Assessment.md`

---

## 1. Problem statement

A few hundred one-page websites, written by strangers, live in a database. Anybody can publish
another one. The product is not the sites — it is **the browser you read them with**: an address
bar, links, back, forward, history, search, and a record of everywhere you have been.

Almost everybody has used a browser. Almost nobody has built one that behaves correctly. The
assessment grades four capabilities and treats four behaviours as non-negotiable:

| Capability | Requirement |
| :-- | :-- |
| **Browse** | Type an address, or follow a link, and read the page that lives at it |
| **Retrace** | Back, forward, and a history anybody can scroll through and jump into |
| **Search** | Find pages across the whole web by what is written in them, not just their titles |
| **Publish** | Anyone can add a site: an address and a page of HTML they wrote themselves |

**Non-negotiable behaviours** (must hold everywhere in the system):

1. Back and forward, including forward being *lost* at the right moments.
2. Restore on return — a page gone back to is the page that was left.
3. History — scrollable, per person, jumpable.
4. Containing HTML you did not write.

The grading posture is explicit: *"We would rather see back, forward and history provably right
than a browser with a toolbar full of buttons that half work."* Every design decision below is
subordinate to that.

---

## 2. Product definition

**Wyxan** is a browser for a small, self-contained web. Two halves that agree with each other:

- **The web** — a corpus of single-page sites, each published at its own address under `*.zz`,
  written by strangers, stored in MongoDB.
- **The browser** — a Next.js application that reads that web: address bar, links, back, forward,
  history, search, publish.

**It is a website, not a desktop application.** It runs in a browser tab, in React, on the stack
above. No Electron, no native shell, no packaging.

### 2.1 Who it is for

There is no account system. A visitor **picks a name from a list**; a publisher picks a name the
same way. That name is who the history belongs to. Anyone can claim any name — an accepted
simplification, because the brief explicitly removes authentication, accounts, and roles.

### 2.2 Product principles

1. **Correctness over features.** Back, forward, restore, history and containment are the product.
   A search that is merely adequate beats a second half-built feature.
2. **The web is the content; the browser is the product.** The chrome is ours to design; the pages
   belong to their authors.
3. **Untrusted by default.** Anyone can publish, so every published page is treated as hostile
   markup until proven otherwise.
4. **Say what you left out.** Ambiguity is resolved by making a judgement call and stating it,
   in the code, in the docs, and in the walkthrough.

---

## 3. Scope

### 3.1 In scope

| # | Capability | Definition of done |
| :-- | :-- | :-- |
| S1 | Address bar | Type an address, press Enter, read the page that lives at it. Input is normalised (`tidepool`, `tidepool.zz`, `http://tidepool.zz/` all resolve alike). |
| S2 | Links | Following a link inside a published page navigates the browser. Links pointing at addresses that never existed land on a truthful "no such address" page — and are still recorded in history. |
| S3 | Back / forward | Both work. Forward can be lost, and is lost exactly when a real browser loses it: navigating after going back, and jumping to an older history entry. |
| S4 | Restore on return | Going back shows the page **as it was left** — byte-for-byte the content that was on screen — not a fresh fetch of whatever lives at that address now. |
| S5 | History | Scrollable list, per person, with the current position marked. Clicking an entry jumps to it. Entries lost from the forward stack are marked, not erased. |
| S6 | Search | Finds pages by what is **written in them**. Title matches rank above body matches. Results are a first-class history entry, so you can return to them. |
| S7 | Publish | Anyone can publish an address and a page of HTML. Address is unique; conflicts are reported clearly. The published page is immediately browsable and searchable. |
| S8 | Containment | Published HTML is rendered isolated from the browser chrome: no access to app state, no storage, no forms, no outbound network. |
| S9 | Identity | A name picker. History and visits are attributed to the chosen name. |
| S10 | Seed data | ~12 interlinked sites with real prose, 6 people, and about an hour of browsing history including repeat visits, long trails and one near-complete trail. Seeding is idempotent and deterministic. |

### 3.2 Out of scope (stated, not silently dropped)

Authentication, accounts, roles · bookmarks · tabs · extensions · downloads · hosting images or
assets · any real network access from published pages · editing an existing site after publish
(an optional `replace` path is a stretch goal) · client-side rendering of author markup in the
app's own DOM · scrolling-position restoration (stretch) · real-time multi-user sync · mobile.

### 3.3 Judgement calls made under ambiguity

The brief invites these: *"Deciding under ambiguity is part of the job."*

| Ambiguity | Decision | Why |
| :-- | :-- | :-- |
| Does going back create a new Visit? | **No.** Back/forward move a cursor; the original Visit keeps its timestamp and `via`. | A real browser does not create a history entry when you press Back. The Visit records the *arrival*, and Back is a return to a known arrival. |
| Is history a log or a stack? | **Both, and they are different things.** Visits are an immutable log; a per-person stack of visit ids is the navigable list. | "Visits are what the history is made of" and "forward can be lost" are only simultaneously satisfiable if the log survives the stack's truncation. |
| Is a search result a page? | **Yes** — a pseudo-address (`search:tidepool`) that occupies a history slot. | The recording is required to show "a search and a return to its results". |
| Do published pages run JavaScript? | **Yes, in an opaque origin.** | Keeps the small web a real web. The cost (no storage, no cookies, no outbound requests, no forms) is documented and enforced. |
| Can a site be edited? | **No**; publish is create-only. (`replace` is a stretch goal.) | The brief leaves it open. Create-only removes an entire class of restore-on-return ambiguity. |
| Who is a "person"? | A name from a seeded list. No authentication. | Explicitly in the brief. |
| What is an address? | A normalised string under `*.zz`, e.g. `tidepool.zz`. Paths allowed. Case-insensitive. | Addresses must be the only thing typed into the address bar, and the only thing an author can point at. |
| Does the address bar also search? | **No.** Dedicated address bar and dedicated search box. | "Address … is the only thing typed into the address bar." Two clear inputs are easier to demo and to defend than one heuristic input. |
| What module format is the API? | **ESM**, end to end — API, shared package and web app. | NestJS 12 is ESM-only: `@nestjs/common` ships no CommonJS build, so a CommonJS API does not compile. The brief never asks for CommonJS, so the platform constraint decides it. |
| What toolchain exactly? | npm 12 workspaces · NestJS 12.5 · Next.js 16.4 · TypeScript 6.0.3 (API) and 7.0.2 (shared, web) · vitest · oxlint. | npm 10's resolver crashes on vitest 4's optional peer graph, and the Nest CLI cannot drive TypeScript 7.0's compiler API until 7.1. Both are platform constraints, not preferences — see SPEC §1.3. |

---

## 4. Data & content requirements

The web must be populated before evaluation. A seed command provides it.

- **~12 sites with real prose** — not lorem ipsum, not one-line placeholders. Enough that browsing
  feels like browsing: you can wander several steps without turning back, and you can reach
  addresses that never existed.
- **Links must matter.** Sites link to each other in a graph deep enough to support a trail four
  deep, including at least three links pointing at addresses with no site behind them.
- **6 people** to browse as. Some of them are authors; a couple of authors own more than one site.
- **~1 hour of browsing history** across those people: repeat visits to the same address, one or
  two long trails, and at least one person who has been nearly everywhere.
- **Search must actually choose.** Seed prose is written so that plausible queries return a
  discriminating subset, not everything.
- **Repeatable.** Seeding twice must not double the web. The same command produces the same sites
  at the same addresses, so the walk in the recording can be walked again.

---

## 5. Functional requirements & acceptance criteria

### FR-1 — Address resolution

**Given** a person types an address into the address bar, **when** they press Enter, **then** the
browser normalises the input, resolves it against the web, records the arrival, and displays the
page or a truthful error page.

Acceptance criteria:

- `tidepool`, `TIDEPOOL`, `tidepool.zz`, `http://tidepool.zz/`, `http://tidepool.zz` all resolve to
  the same address.
- An address with no site behind it produces a "no such address" page naming the address.
- An address outside the `*.zz` web produces a distinct "that address is not part of this web"
  page — the two failures are not conflated.
- Malformed input (empty, whitespace, illegal characters) is rejected inline without a navigation
  and without a Visit.
- Every arrival — including one that 404s — is recorded in history.

### FR-2 — Links

**Given** a published page contains a link, **when** the reader clicks it, **then** the browser
navigates to that address, recording the arrival and its referrer.

Acceptance criteria:

- Relative links resolve against the page's own address.
- Links to non-existent addresses navigate to the "no such address" page, and that page is itself
  a recorded arrival.
- A link cannot navigate the browser outside the web, break the chrome, or run code in the app's
  origin.

### FR-3 — Back and forward

**Given** a person has navigated, **when** they press Back, **then** the browser returns to the
previous entry; **and** Forward returns to the one they left.

Acceptance criteria:

- Back at the start of history and Forward with an empty forward stack are no-ops, and the
  corresponding control is visibly disabled.
- Pressing Back then navigating somewhere new **loses** the forward entries. The lost entries are
  still present in the permanent visit log, and are visibly marked as lost in the history list.
- Jumping to an older history entry also discards the forward entries, as in a real browser.

### FR-4 — Restore on return

**Given** a person visits a page, **when** they go back to it later, **then** they see the page
as it was left.

Acceptance criteria:

- Back and forward replay the content recorded at the time of the original arrival — they do not
  re-fetch the site.
- If the underlying site were later replaced, the restored page still shows the version that was
  on screen originally. (This is demonstrated in the recording.)
- A page that was not found still restores as "not found" rather than silently becoming a live
  page.

### FR-5 — History

**Given** a person has browsed, **when** they open the history panel, **then** they see a
scrollable, ordered list of their arrivals.

Acceptance criteria:

- The list is per person and persists across reloads.
- The current position is marked.
- Clicking an entry jumps to it (and the arrival is not duplicated into the log).
- Entries that were lost from the forward stack are shown, marked as lost.
- The list records *how* each arrival happened (typed, link, search, publish, …).

### FR-6 — Search

**Given** a person enters a query, **when** they submit it, **then** they see pages across the
whole web that contain what they typed.

Acceptance criteria:

- The body of the page is searched, not just the title. A query appearing only in prose matches.
- Title matches rank above body matches; an exact title match ranks first.
- Results show title, address and a snippet drawn from the matching body text.
- Results occupy a history slot, so returning to them is a Back.
- A query matching nothing returns an honest empty state, not a fallback listing of everything.

### FR-7 — Publish

**Given** a person with a name, **when** they submit an address, a title and a page of HTML,
**then** the site is published and immediately browsable and searchable.

Acceptance criteria:

- The address is taken on success; a clash returns a clear conflict and a suggested alternative.
- The published page renders as the author wrote it, inside the containment boundary.
- The text of the page is searchable as soon as it is published.
- Publishing creates an arrival to the new address, recorded in the publisher's history.
- Oversized input is rejected with a clear limit, not silently truncated.

### FR-8 — Containment

**Given** a hostile page has been published, **when** it is rendered, **then** it cannot reach the
browser's chrome, the app's state, the user's storage, or the network.

Acceptance criteria:

- Author markup is never inserted into the app's own DOM.
- The rendering context has an opaque origin: no access to app cookies, storage, or the DOM tree.
- Scripts in the page run, but cannot navigate the top frame, submit forms, or open popups.
- The page cannot make any network request (no remote images, fonts, scripts or beacons).
- The app's own security headers (CSP, `nosniff`, `frame-ancestors`) are set and demonstrable.
- The containment story is explainable line-by-line, with the cost to authors stated.

### FR-9 — Identity

Acceptance criteria: a name picker lists the seeded people; the choice persists across reloads;
history and visits are attributed to it; switching name switches whose history is shown.

---

## 6. Non-functional requirements

| Area | Requirement |
| :-- | :-- |
| Stack | Next.js 16 + NestJS 12 (ESM) + MongoDB 8 + TypeScript, as specified. TypeScript strict mode. |
| Reproducibility | A reviewer runs four commands and sees the web. No manual setup beyond Docker, Node 22+ and npm 12. |
| Determinism | The seed command is idempotent and produces byte-identical data on every run. |
| Correctness evidence | Automated tests cover address normalisation, search-text extraction, and every back/forward/truncation rule. |
| Performance | Navigation and search are interactive at the scale of the seeded corpus; no page reload between navigations (the browser is a SPA). |
| Security posture | Containment headers demonstrable; no author content in the app origin; no auth assumed. |
| Accessibility | Keyboard operable: address bar, back/forward, history entries and search reachable by keyboard; visible focus states; controls have accessible names. |
| Observability | Structured server logs for navigation, publish, and search; a health endpoint. |

---

## 7. Success criteria

The assessment is graded on behaviour, not features. Success is:

1. **Back and forward are provably right.** A reviewer can press Back four times, Forward three
   times, and see exactly the pages they expect, in the expected order — including the forward
   entry being gone after a new navigation.
2. **Restore on return is visible.** The reviewer edits or replaces a site, presses Back, and sees
   the old version still on screen.
3. **History is a real record.** Scrollable, per person, jumpable, and showing how each arrival
   happened.
4. **Search discriminates.** A query for something in the prose returns the right handful of pages,
   with the best match first, and Back returns to the results.
5. **Containment is explainable.** The reviewer can point at the line that contains author HTML
   and hear what it costs authors.
6. **The walkthrough can be walked again.** The seed is deterministic, so the recording's path
   exists in the database after a fresh reseed.

---

## 8. Deliverables

| # | Deliverable | Definition of done |
| :-- | :-- | :-- |
| D1 | Source | One git repository, **npm 12 workspaces**, `apps/web` (Next.js 16) + `apps/api` (NestJS 12, ESM) + `packages/shared` (ESM + types). Real commit history — one meaningful commit per slice, no single "initial commit" dump. |
| D2 | Seed | `npm run seed` builds the corpus and the browsing history. Idempotent. `--reset` available. |
| D3 | Run instructions | The commands for both sides and for seeding. No write-up, just the commands — in the README, and repeated in the recording. |
| D4 | Narrated screen recording | 4–5 minutes, voice-over, covering: a trail four deep; back and forward across it; a search and a return to its results; a publish; an address that leads nowhere. Explains the model chosen, how back/forward are made to hold, how untrusted HTML is contained, and what was knowingly left out. |
| D5 | Architecture documents | PRD (this file), SPEC, PLAN, plus a short README. |

---

## 9. Risks & mitigations

| Risk | Impact | Mitigation |
| :-- | :-- | :-- |
| Forward-stack semantics implemented wrong | Fails the core criterion | Encode history as a pure state machine in `packages/shared`, unit-test every transition, and drive the API through it. |
| The reviewer's toolchain cannot install the tree | `npm install` dies with `Cannot read properties of null (reading 'edgesOut')` on npm 10 | The README names npm 12 as a prerequisite (`npm i -g npm@12`) and the lockfile is committed, so `npm ci` on npm 12 is deterministic. |
| Untrusted HTML escapes containment | Fails a non-negotiable | Multiple independent layers (separate origin, `iframe sandbox`, CSP `sandbox`, `default-src 'none'`). Defence in depth: no single layer is load-bearing. |
| Restore-on-return drifts from what was seen | Fails a non-negotiable | Store a content snapshot with the arrival; render from the snapshot, never re-fetch on Back. |
| Search returns everything | Fails "search has to actually choose" | Rank by text score with title weight; seed prose with discriminating vocabulary; verify with fixture queries in tests. |
| Seeding twice doubles the web | Fails "repeatable" | Deterministic `_id`s derived from stable keys + upserts; a test asserts count stability across two runs. |
| The iframe swallows link clicks | Broken navigation from published pages | A single injected bridge script intercepts clicks and posts the URL to the app; the app validates the URL before navigating. |
| Time overrun | Incomplete submission | A published cut-list (below); tests and containment are never cut, extras are. |
| Two-origin setup confuses a reviewer | "It won't run" | `WEB_ORIGINS` env lists allowed framing origins; both `localhost` and `127.0.0.1` accepted; README states the reason. |

### Cut list (if time runs short)

Cut in this order, keeping the non-negotiables intact:
1. `replace` publishing (stretch).
2. Scroll-position restoration (stretch).
3. Playwright end-to-end suite (unit + integration tests still run).
4. Snippet highlighting and result previews beyond title/address/snippet.
5. Replace-navigation polish (e.g. offering a near-miss address suggestion).

---

## 10. Open questions for the reviewer

Raised as questions, because the brief invites them — each with the default we will ship if no
answer arrives:

1. **May a published page run JavaScript?** *Default:* yes, in an opaque origin — no storage, no
   cookies, no network, no forms, no top-level navigation.
2. **Should Back create a new visit?** *Default:* no. Back/forward move a cursor over an
   immutable arrival log.
3. **Should search results occupy a history slot?** *Default:* yes, so "return to results" is a Back.
4. **May a site be edited after publish?** *Default:* no, publish is create-only.
5. **Is a per-person history persistent across sessions?** *Default:* yes — history belongs to the
   name, not the browser tab.
