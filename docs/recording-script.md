# Recording script — Wyxan

A narrated walkthrough of the small web and the browser that reads it. Read the **Do** lines as
what happens on screen; the text in quotation marks is what you say.

The spoken narration is **870 words** with the three optional sentences dropped, or **960** with them
in. That is about **4:58 at a brisk 175 words a minute**, or 5:16 at 165. The timings below assume
the *[cut]* sentences are dropped; each is worth about seven seconds, so keeping all three adds
about twenty-five seconds. The CSP header in Beat 7 is *shown*, not read aloud, so it is not
counted.

> The brief asks for five demonstrations and four explanations. They are all here:
>
> | Required | Where |
> | :-- | :-- |
> | a trail four deep | Beat 2 |
> | back and forward across it | Beat 3 |
> | forward being lost | Beat 3 |
> | a search, and a return to its results | Beat 4 |
> | a publish | Beat 5 |
> | an address that leads nowhere | Beat 6 |
> | the model you chose | Beats 1, 3, 4 |
> | how back and forward are made to hold | Beats 2, 3 |
> | how the HTML you did not write is contained | Beat 7 |
> | what you knowingly left out | Beat 8 |

---

## Before you record

**Reset the world.** The walk is repeatable because the seed is deterministic — but your own
testing will have added to it, and replaced pages.

```bash
npm run seed -- --reset
```

**Two terminals.**

```bash
docker compose up -d mongo
npm run dev:api      # terminal 1
npm run dev:web      # terminal 2
```

**Browser.** <http://localhost:3000>, devtools closed, window about **1280 × 800** so the page and
the history panel both fit.

**Choose Dev** (top right). His trail is the one to record: sixteen arrivals, twelve different
pages, one search, two repeat visits, one link to nowhere — and his cursor sits mid-trail, so Back
*and* Forward are both live from the first frame.

**Have the shell ready** for Beat 7. Paste this now:

```powershell
$id = (Invoke-RestMethod "http://127.0.0.1:4000/api/history?personId=7c928e6fa51a469895bf404c").entries[-1].visitId; curl.exe -sI "http://127.0.0.1:4000/render/$id"
```

**One habit that saves the recording:** narrate the *idea*, not the clicks. "I'm going back twice,
and notice what hasn't happened" carries the weight; "clicking the back button" doesn't.

---

## Beat 1 — The shell · 0:00 → 0:22

**Do** · The browser as Dev, history panel open on the right, sixteen arrivals visible.

> "A small web: twelve pages, written by strangers, in a database. Anybody can publish another one.
> This is the browser you read them in.
>
> Three decisions shape it: the history model, the snapshot, the origin split.
>
> On the right, Dev's history — sixteen arrivals, each labelled with how he got there. His cursor is
> mid-trail, so back and forward are both lit."

---

## Beat 2 — A trail four deep · 0:22 → 0:52

**Do** · Type `tidepool`, press Enter. Wait for the page. Then click **Kelp Forest** → **Hermit
Crabs** → **Shell Phonebook**.

> "'Tidepool', press Enter. It normalises to tidepool.zz and the page appears — inside a frame, from
> a different origin. I'll come back to why.
>
> Now a link inside that page — not mine, HTML somebody else wrote — and the click still navigates
> my browser. Kelp Forest. Hermit Crabs. Shell Phonebook. Four deep, each recorded: the address,
> the time, how I got there.
>
> Some of these links point at addresses that have never existed. The link graph is the navigation of
> the small web."

---

## Beat 3 — Back, forward, and losing forward · 0:52 → 1:43

**Do** · Click **Back** twice. Then type `dust-and-salt.zz` and press Enter. Show the history panel —
two entries struck through and marked **lost**. Show that Forward is disabled. Then click an older
entry in the panel.

> "Back. Back. Two arrivals back — and notice what *hasn't* happened: no new history entries. Back
> is a return to an arrival that already happened; the record still says how it first happened.
>
> Now the part that's easy to fake. I go back again, then type a new address. Forward is gone — the
> button is dead. Two entries ahead of me fell off the stack.
>
> They're not deleted: struck through, marked lost. The brief wants a record of everywhere you've
> been *and* forward that can be lost — and those pull opposite ways if history is one list.
>
> So: two structures. The log is append-only, never rewritten; the stack truncates. Navigate from
> the middle and the entries ahead fall off, get marked, and stay in the log forever. Forward being
> lost is visible, not silent.
>
> *[cut]* The panel is scrollable, per person — it belongs to the name, not the tab — and you can
> jump into it. Choosing an entry is a navigation, so it discards the forward entries again."

---

## Beat 4 — Search, and back to the results · 1:43 → 2:15

**Do** · Type `ledger` in the **search** box, press Enter. Show the three results. Click **Otter
Ledger**. Then press **Back**.

> "Search — and deliberately not the address bar. An address is an address; a search is a question
> about what's *written in* the pages.
>
> 'ledger' returns three pages of twelve. Two are about ledgers and they're first — a title match
> weighs ten times a body match. The third only mentions the word in a sentence.
>
> I'll click one. Now Back — I don't get a re-run search, I get the results that were on screen. A
> search is an arrival, and the results are part of its snapshot."

---

## Beat 5 — Publishing, and restoring a page · 2:15 → 3:07

**Do** · Click **Publish**. Address `tidepool.zz`, title `Tidepool`, HTML:
`<h1>Tidepool</h1><p>The light has moved on.</p>`. Tick **"Replace the page at this address"**.
Publish. You land on the short new page. Now press **Back** — the long original comes back. Then
click **Publish** again, address `my-first-page.zz`, title `My First Page`, HTML:
`<h1>My First Page</h1><p>Written by me.</p>`. Publish.

> "Anyone can publish: an address and a page of HTML you wrote. The address is the only thing that
> identifies it, and if it's taken you get a conflict with a suggestion.
>
> First, let me replace a page I've already read. Same address, different words — the browser
> navigates to it, because publishing is an arrival. Now press Back. I get the *old* page — the long
> one. Not a re-fetch of the page as it is now; the page as it was when I arrived.
>
> That's the snapshot: every arrival keeps a copy of what was on screen. Re-fetching on Back
> couldn't honour 'a page gone back to is the page that was left'. Here the page had been replaced,
> and it made no difference.
>
> And a new address — my-first-page.zz — works the same way. The page is searchable from the moment
> it exists."

---

## Beat 6 — An address that leads nowhere · 3:07 → 3:31

**Do** · Type `ghost-reef.zz`, press Enter.

> "An address that leads nowhere: ghost-reef.zz, a real-shaped address that has never had a site
> published at it. That's a truthful 'no such address' page, not a browser error — and a different
> page from an address outside the web, like example.com, which is 'not part of this web'. The brief
> wants those as two different failures. And this arrival is recorded too: it went somewhere."

---

## Beat 7 — Containment · 3:31 → 4:32

**Do** · Switch to the terminal. Run the prepared command. Show the headers, pointing at the
`Content-Security-Policy` line. Switch back to the browser.

> "Let me show you the headers rather than claim it. This is what the server sends for every
> published page:
>
> Content-Security-Policy: sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline';
> style-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action
> 'none'; frame-ancestors http://localhost:3000 http://127.0.0.1:3000
>
> The headline is: sandbox allow-scripts, and default-src none. Plus base-uri none, form-action
> none, frame-ancestors my own app — and nosniff, no-referrer, no-store.
>
> Seven layers, none load-bearing alone. The one I'd point at: my app is on localhost:3000,
> published pages come from 127.0.0.1:4000. Different origins — so even with every other layer
> missing, a published page can't reach my cookies, storage or DOM.
>
> Then the frame is sandboxed: no same-origin, no forms, no popups, no top-level navigation. And the
> policy sandboxes the document too, so containment holds even if you open that render URL in a tab
> directly. `default-src 'none'` means nothing may be fetched.
>
> What does it cost authors? Their JavaScript still runs, but in an opaque origin with no network:
> no storage, no cookies, no forms, no outbound request at all. Author pages are offline documents —
> the trade for making 'anyone can publish' safe.
>
> *[cut]* One thing I do add: a single script at the end of every published page — a sandboxed frame
> can't navigate its parent, so without it a link inside someone's page would do nothing. It's a click
> handler that posts the href to me; I resolve it and check it. The only injection in the system."

---

## Beat 8 — What was left out, and how to run it · 4:32 → 5:05

**Do** · Back in the browser. Show the README, scrolling to "Knowingly left out" and then to the run
commands.

> "What did I knowingly leave out? No auth, accounts or roles — you pick a name, and that name is
> who the history belongs to. No bookmarks or tabs. No downloads, no hosted images. No real network
> from published pages. No editing beyond an explicit replace. No scroll-position restoration. And
> no fuzzy search — that's MongoDB's text index, one per collection: right for twelve pages, wrong
> for a corpus.
>
> *[cut]* To run it: Node 22, npm 12, Docker — four commands, in the README. The seed is
> deterministic, so this walk can be walked again.
>
> That's the small web: twelve pages, six people, an hour of browsing, and a browser that knows what
> it has seen."

---

## If it goes wrong

| Symptom | Do this |
| :-- | :-- |
| History panel is empty | You're browsing as someone with no history. Pick **Dev** (or **Ada**). |
| The trail isn't four deep | You're on a page with no outgoing links. Start from `tidepool`, which links to four others. |
| Beat 5 shows the new page after Back | You published without ticking "Replace the page at this address", so the server refused it with a conflict. Tick the box. |
| No "lost" entries after the demo | You navigated from the *end* of the stack, so nothing was ahead of you. Go back two or three first, then type a new address. |
| Search returns nothing | You typed into the address bar, not the search box. The search box is on the right, with the magnifier. |
| The publish preview is blank | The preview frame is sandboxed with no network. Type plain HTML — no `<img src="https://…">`. |
| The terminal shows nothing | Run the prepared command again — it reads the most recent arrival, so it needs one to exist. |
| Running long | Drop the three *[cut]* sentences — about twenty-five seconds. |
| Running short | Pause in Beat 3 after the forward button greys out. Let them see it. |

---

## The three things a reviewer will look for

If you only get three right, make them these.

1. **Forward being lost, and the entries still being there.** Beat 3. The struck-through entries in
   the history panel are the proof.
2. **The restore.** Beat 5. Publish a replacement for a page you have already read, then go back —
   the old version comes back, because each arrival keeps a copy of what was on screen.
3. **The headers.** Beat 7, with the terminal. Containment is the easiest thing to claim and the
   hardest to believe, and the headers make it checkable in five seconds.
