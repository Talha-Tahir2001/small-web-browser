# Recording script — Wyxan

A four-and-a-half minute narrated walkthrough of the small web and the browser that reads it.

This is the script to read aloud, beat by beat. The **Do** lines are what happens on screen; the
text in quotation marks is what you say. Times are cumulative, and the whole thing lands at about
**4:45**.

> The brief asks for five things to be demonstrated and four things to be explained. They are all
> here, in this order:
>
> | Required | Where |
> | :-- | :-- |
> | a trail four deep | Beat 2 |
> | back and forward across it | Beat 4 |
> | forward being lost | Beat 4 |
> | a search, and a return to its results | Beat 6 |
> | a publish | Beat 7 |
> | an address that leads nowhere | Beat 8 |
> | the model you chose | Beats 1, 3 and 4 |
> | how back and forward are made to hold | Beats 3 and 4 |
> | how the HTML you did not write is contained | Beat 9 |
> | what you knowingly left out | Beat 10 |

---

## Before you record

**Reset the world.** The walk is only repeatable if the seed is deterministic, and it is — but your
own testing will have added to it, and your own testing will have replaced pages.

```bash
npm run seed -- --reset
```

**Two terminals.** One with the browser, one with a shell for the headers in Beat 9.

```bash
docker compose up -d mongo
npm run dev:api      # terminal 1
npm run dev:web      # terminal 2
```

**Browser.** Open <http://localhost:3000>. Close devtools. Make the window about **1280 × 800** so
the page and the history panel both fit without scrolling. Light or dark mode, whichever reads
better on camera.

**Choose Dev.** Top right, "Browsing as" → **Dev**. His trail is the one to record: sixteen
arrivals, twelve different pages, one search, two repeat visits, one link to nowhere — and his
cursor sits in the middle, so Back *and* Forward are both live from the first frame.

**Have the shell ready** for Beat 9. Paste this now so you can run it later without typing:

```powershell
$id = (Invoke-RestMethod "http://127.0.0.1:4000/api/history?personId=7c928e6fa51a469895bf404c").entries[-1].visitId; curl.exe -sI "http://127.0.0.1:4000/render/$id"
```

**One habit that saves the recording:** narrate the *idea* as you do it, not the clicks. "I'm going
back twice, and notice what has not happened" is the line that carries the weight; "clicking the
back button" is not worth the seconds.

---

## Beat 1 — The shell · 0:00 → 0:25

**Do** · The browser, browsing as Dev, history panel open on the right. Sixteen arrivals visible.

> "This is a small web. Twelve pages here, written by strangers, living in a database — and anybody
> can publish another one. This is the browser you read them in: an address bar, links, back,
> forward, history, search, and a record of everywhere you have been.
>
> Three decisions shape everything you are about to see, and I'll show you each as I go: the history
> model, the snapshot, and the origin split.
>
> On the right is Dev's history. Sixteen arrivals, every one recorded, each labelled with how he
> got there — typed, link, or search. His cursor is sitting in the middle of his trail, which is why
> both the back and forward buttons are lit."

---

## Beat 2 — A trail four deep · 0:25 → 1:05

**Do** · Type `tidepool` in the address bar, press Enter. Wait for the page. Then, in the page
itself, click **Kelp Forest** → **Hermit Crabs** → **Shell Phonebook**.

> "Type an address — 'tidepool' — and press Enter. It normalises to tidepool.zz, and the page
> appears. Notice that the page is drawn inside a frame, from a different origin. I'll come back to
> why in a minute.
>
> Now I click a link inside that page. This page isn't mine — it's HTML somebody else wrote — and
> the click still navigates my browser. Kelp Forest. Then Hermit Crabs. Then Shell Phonebook.
>
> That's four arrivals deep, and every one has been recorded: the address, the time, and how I got
> there.
>
> These pages link to each other, and some of them link to addresses that have never existed. The
> link graph is the navigation of the small web, and it's why you can wander without turning back."

---

## Beat 3 — The snapshot · 1:05 → 1:35

**Do** · Click **Publish**. Address `tidepool.zz`, title `Tidepool`, HTML:
`<h1>Tidepool</h1><p>The light has moved on.</p>`. Tick **"Replace the page at this address"**.
Publish. You land on the new, shorter page. Now press **Back**.

> "Before I go on, let me change the page behind me. I'll publish a replacement for tidepool — same
> address, different words. The browser navigates to it, because publishing is an arrival.
>
> Now press Back. And I get the *old* page back — the long one, with the tidepool in it. Not a
> re-fetch of the page as it is now; the page as it was when I arrived.
>
> That's the second decision: every arrival keeps a copy of what was on screen. It's denormalised
> into the visit on purpose, because the alternative — re-fetching the site when you go back —
> cannot honour 'a page gone back to is the page that was left'. The site might have been replaced
> since. Here it had been, and it made no difference."

---

## Beat 4 — Back, forward, and losing forward · 1:35 → 2:25

**Do** · Click **Back** twice. Then type `dust-and-salt.zz` and press Enter. Then show the history
panel — two entries struck through and marked **lost**. Then show that Forward is disabled.

> "Back. Back. Two arrivals back — and notice what has *not* happened. No new history entries. Back
> is not a new arrival; it is a return to an arrival that already happened. The record still says
> 'link'. It still says when it first happened.
>
> Now — and this is the part that is easy to fake — I go back again, and then I type a new
> address. And now forward is gone. The forward button is dead. Two entries that were ahead of me
> have been pushed off the end of the stack.
>
> Look at the history panel. They aren't deleted. They're struck through and marked lost. Because
> the brief asks for two things at once: a record of everywhere you have been, *and* forward that
> can be lost. Those pull in opposite directions if history is one list.
>
> So there are two structures. The arrival log is append-only and never rewritten. The stack is the
> navigable surface, and it is truncatable. Navigate from the middle and the entries ahead fall off
> the stack and get marked — and they stay in the log forever. Forward being lost is visible, not
> silent."

---

## Beat 5 — The history panel · 2:25 → 2:45

**Do** · Scroll the history panel. Click an older entry — the cursor moves, and the forward entries
are discarded. Then click one of the **struck-through** entries.

> "The history panel is scrollable, per person — it belongs to the name, not to the tab — and you
> can jump into it. Clicking an older entry moves the cursor there, and, exactly as in a real
> browser, choosing an entry from the history list is a navigation, so it discards the forward
> entries again.
>
> And an entry that has already fallen off the stack — one of the struck-through ones — clicking
> that visits it again, which is what a real browser does with an old history entry."

---

## Beat 6 — Search, and back to the results · 2:45 → 3:15

**Do** · Type `ledger` in the **search** box, press Enter. Show the three results. Click **Otter
Ledger**. Then press **Back**.

> "Search. The search box is deliberately not the address bar: an address is an address, and a
> search is a question about what is *written in* the pages.
>
> 'ledger' returns three pages out of twelve. Two of them are the pages actually about ledgers, and
> they're first, because a title match weighs ten times a body match. The third only mentions the
> word in a sentence. The search reads the body, not just the title.
>
> I'll click one. Now — press Back. And I don't come back to a re-run search. I come back to the
> results that were on screen. A search is an arrival: it has a place in the history, and the
> results are part of its snapshot."

---

## Beat 7 — Publishing · 3:15 → 3:35

**Do** · Click **Publish**. Address: `my-first-page.zz`. Title: `My First Page`. HTML:
`<h1>My First Page</h1><p>Written by me, and published into the small web.</p>`. Publish. The
browser lands on the new page.

> "Anyone can publish. An address and a page of HTML you wrote yourself. The address is the only
> thing that identifies it — and if it's already taken, you get a clear conflict with a suggestion:
> the nearest free address of the same shape.
>
> I'm publishing my-first-page.zz. And the browser navigates to it, because publishing is an
> arrival too. The page is searchable from the moment it exists."

---

## Beat 8 — An address that leads nowhere · 3:35 → 3:55

**Do** · Type `ghost-reef.zz` in the address bar, press Enter.

> "Now an address that leads nowhere. ghost-reef.zz — a real-shaped address in this web that has
> never had a site published at it.
>
> That's a truthful 'no such address' page, not a browser error. And it's a different page from the
> one you'd get for an address outside the web altogether — an address like example.com is 'not part
> of this web'. The brief asks for those to be two different failures, so they are.
>
> And notice this arrival is recorded too. It went somewhere. You can come back to it."

---

## Beat 9 — Containment · 3:55 → 4:40

**Do** · Switch to the terminal. Run the prepared command. Show the headers, pointing at the
`Content-Security-Policy` line. Switch back to the browser.

> "This is the part I most wanted to get right, so let me show you the headers rather than claim
> it. This is what the server sends for every published page:
>
> Content-Security-Policy: sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline';
> style-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action
> 'none'; frame-ancestors http://localhost:3000 http://127.0.0.1:3000
>
> Plus nosniff, no-referrer, and no-store.
>
> There are seven layers here and none of them is load-bearing on its own. The first is the one I'd
> point at: my app runs on localhost:3000, and published pages are served from 127.0.0.1:4000. To a
> browser those are different origins — so even if every other layer were missing, a published page
> could not reach my cookies, my storage, or my DOM.
>
> Then the frame itself is sandboxed: no allow-same-origin, no forms, no popups, no top-level
> navigation. And the policy puts a sandbox on the document as well, so the containment still holds
> if you open that render URL directly in a tab instead of in my frame — that's the layer most
> people would miss. `default-src 'none'` means nothing may be fetched: no remote images, no fonts,
> no beacons, no exfiltration. `base-uri 'none'` means a `<base>` tag can't hijack how links
> resolve. `frame-ancestors` means only my app may frame it.
>
> And what does that cost the authors? Their JavaScript still runs — a page with no scripts isn't a
> web. But it runs in an opaque origin with no network: no localStorage, no cookies, no fetch to my
> API, no form submission, no popups, no top-level navigation, no outbound request at all. Author
> pages are, in effect, offline documents. That's the trade for making 'anyone can publish' safe,
> and I'm stating it plainly rather than hiding it.
>
> There is one thing I do add: a single script, at the end of every published page. A sandboxed
> frame can't navigate its parent, so without it a link inside someone's page would do nothing at
> all. It's a click handler that posts the href to me; I resolve it against the address of the page
> on screen and check it before navigating. That's the only injection in the whole system, and it has
> a commit of its own."

---

## Beat 10 — What was left out, and how to run it · 4:40 → 4:55

**Do** · Back in the browser. Show the README, scrolling to "Knowingly left out" and then to the run
commands.

> "So what did I knowingly leave out? No authentication, accounts or roles — you pick a name from a
> list, and that name is who the history belongs to. No bookmarks, tabs or extensions. No
> downloads, and nothing that hosts images. No real network from published pages. No editing of a
> published page beyond an explicit replace. No scroll-position restoration, which a real browser
> does do. And no fuzzy search or autocomplete — that's MongoDB's text index, with its English
> stemmer and stop-word list, and it allows one text index per collection. For twelve pages that's
> the right trade; for a larger corpus it would be Atlas Search or Meilisearch.
>
> To run it: Node 22 or newer, npm 12, and Docker. Four commands — npm install, docker compose up
> -d mongo, npm run seed, and then npm run dev:api and npm run dev:web in two terminals. The seed
> is deterministic, so this exact walk can be walked again.
>
> That's the small web. Twelve pages, six people, an hour of browsing, and a browser that knows what
> it has seen."

---

## If it goes wrong

| Symptom | Do this |
| :-- | :-- |
| History panel is empty | You are browsing as someone with no history. Pick **Dev** (or **Ada**). |
| The trail is not four deep | You are on a page with no outgoing links. Start the trail from `tidepool`, which links to four others. |
| Beat 3 shows the new page after Back | You published *over* the address without ticking "Replace the page at this address", so the server refused it with a conflict. Tick the box. |
| No "lost" entries after the demo | You navigated from the *end* of the stack, so nothing was ahead of you. Go back two or three first, then type a new address. |
| Search returns nothing | You typed into the address bar instead of the search box. The search box is the one on the right, with the magnifier. |
| The publish preview is blank | The preview frame is sandboxed with no network, so it will not load anything external. Type plain HTML — no `<img src="https://…">`. |
| The terminal shows nothing | Run the prepared command again — it reads the most recent arrival, so it needs at least one arrival to exist. |
| You went over time | Cut Beat 5 (the history panel walkthrough) and the first paragraph of Beat 10. Both are explanatory, not demonstrative. |
| You went under time | Pause in Beat 4 after the forward button greys out — let them see it. |

---

## The three things a reviewer will look for

If you only get three things right, make them these.

1. **Forward being lost, and the entries still being there.** Beat 4. The struck-through entries in
   the history panel are the proof.
2. **The restore.** Beat 3. Publish a replacement for a page you have already read, then go back —
   the old version comes back, because each arrival keeps a copy of what was on screen. This is
   the snapshot model earning its place.
3. **The headers.** Beat 9, with the terminal. Containment is the thing that is easiest to claim and
   hardest to believe, and the headers are what make it checkable in five seconds.
