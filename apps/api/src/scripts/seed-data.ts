import type { VisitVia } from '@small-web-browser/shared';

/**
 * The small web, written down.
 *
 * Everything here is fixed: the same command gives the same sites at the
 * same addresses with the same words, every time. Nothing is generated and
 * nothing depends on the clock.
 */

export type SeedPerson = {
  name: string;
  slug: string;
};

export type SeedSite = {
  address: string;
  title: string;
  author: string;
  html: string;
};

export type SeedArrival = {
  /** The address that was asked for. */
  address: string;
  /** How the reader got there. */
  via: VisitVia;
  /** Minutes after that person's browsing began. */
  minute: number;
  /**
   * True when this arrival has fallen off the end of the navigable stack.
   *
   * A pruned arrival is still in the permanent log - it is marked, not
   * deleted - which is how the "forward was lost" state is visible from the
   * very first launch.
   */
  pruned?: boolean;
};

/**
 * The hour the people of this web spend reading it.
 *
 * Every arrival is timed from a fixed epoch, so the same command always
 * produces the same history at the same times.
 */
export const BASE_TIME = Date.parse('2026-03-14T09:00:00.000Z');

export const PEOPLE: SeedPerson[] = [
  { name: 'Ada', slug: 'ada' },
  { name: 'Bram', slug: 'bram' },
  { name: 'Cleo', slug: 'cleo' },
  { name: 'Dev', slug: 'dev' },
  { name: 'Esme', slug: 'esme' },
  { name: 'Fay', slug: 'fay' },
];

export const SITES: SeedSite[] = [
  {
    address: 'tidepool.zz',
    title: 'Tidepool',
    author: 'Ada',
    html: `<h1>Tidepool</h1>
<p>There is a shelf of rock at the north end of the bay where the sea keeps a little pool of
its own. Twice a day the tide hands it back, and twice a day it takes it away, and in between
the pool holds what the sea dropped: periwinkles, a crab too small to have a name, the fronds
of kelp lying flat like brown ribbon.</p>
<p>I have been coming here long enough to know the pool by its moods. On a spring tide it is
brine and noise and nothing survives the hours. On a neap tide it goes quiet and cloudy, and
the hermit crabs come out to walk the rim, which you can watch if you are patient and quiet
enough. I am usually neither, and I still see them.</p>
<p>The people who wrote the other pages here are friends of mine, mostly. There is
<a href="gull-counts.zz">a count of the gulls</a> I keep failing to finish, an
<a href="the-tiny-internet.zz">essay about this place being a web</a>, and
<a href="kelp-forest.zz">Bram's account of the kelp</a>, which is better than mine. Somewhere
out past the point the <a href="ghost-reef.zz">ghost reef</a> is supposed to be, though I
have never seen it.</p>`,
  },
  {
    address: 'gull-counts.zz',
    title: 'Gull Counts',
    author: 'Ada',
    html: `<h1>Gull Counts</h1>
<p>How many gulls are on the point at dawn? I have been trying to find out since the autumn,
and the honest answer is that the number is not a number. It is a shape.</p>
<p>On some mornings the gulls stand in a line along the wall, close enough that you can count
the gaps between them. On others they hang in the air off the cliff and turn together, and
there is no count of that at all - only a rough sense of how much dark is moving at once. What
changes between the two is the wind, and what I have learned is to write the wind down first
and the gulls second.</p>
<p>So the count is a column in the book I keep for this shore, next to the wind and the
temperature, and the column is usually blank. I have learned to write "the point was loud"
and that counts for something.</p>
<p>Ask <a href="anchorite.zz">Dev</a> about the gulls that come inland. He will tell you
about the <a href="drowned-forest.zz">drowned forest</a>, which is a different story
entirely.</p>`,
  },
  {
    address: 'the-tiny-internet.zz',
    title: 'The Tiny Internet',
    author: 'Ada',
    html: `<h1>The Tiny Internet</h1>
<p>There is no server for this place. There is a pool of water, a rock, and about two hundred
people who each write a page and hang it where other people can find it. That is the whole
mechanism, and it is enough.</p>
<p>I mean it the way a gardener means it. I write about the sea; Bram writes about kelp;
Cleo writes a directory of shells that she has personally identified. None of us edit each
other and none of us are paid. We link to each other, and when we stop linking we stop being
read, and then we stop writing, and that is the end of it. There is no copy of this page
anywhere. If I stop writing it, it is gone - except in the ledgers of people who have read it
and written down that they did.</p>
<p>The <a href="otter-ledger.zz">otter's own count</a> is the strangest document here, and
<a href="moon-ledger.zz">Esme's record of the moon</a> is the strangest of all. I have read both, and
I still do not entirely understand what they are for.</p>
<p>Somebody asked me once whether this is the internet. It is not. It is smaller and slower
and nobody can be found, and there is one word for the whole of it that I like better:
<a href="dust-and-salt.zz">dust and salt</a>.</p>`,
  },
  {
    address: 'kelp-forest.zz',
    title: 'Kelp Forest',
    author: 'Bram',
    html: `<h1>Kelp Forest</h1>
<p>Below the low water mark the sea floor is not sand but forest. Not trees - the giant kelp
does not stand the way a tree stands - but a canopy, a ceiling, and a forest in the sense that
things live in it and hide in it.</p>
<p>A kelp holds fast to the rock by a rootlike holdfast and grows upward in a single frond that
can put on two feet in a day. It has no branches and no leaves in the ordinary sense; each
blade carries its own small bulb of gas, and the whole frond floats. The forest moves in the
surge. Standing on the shore in the right place you can watch an acre of it lean over and
come back, all at once, for twenty minutes.</p>
<p>Below the canopy is the light, and below the light is the forest floor, and on that floor
live the <a href="hermit-crabs.zz">hermit crabs</a>, who take their houses with them. The
<a href="saltmarsh-almanac.zz">book of Tuesdays</a> I keep records the canopy height, the holdfast count
and the temperature at four depths. I have logged this for six winters.</p>
<p>There is a place where the kelp grows thick enough that the fish do not come out of it.
People call it <a href="the-lost-lighthouse.zz">the lost lighthouse</a>. It is not a
lighthouse. I have looked.</p>`,
  },
  {
    address: 'saltmarsh-almanac.zz',
    title: 'Saltmarsh Almanac',
    author: 'Bram',
    html: `<h1>Saltmarsh Almanac</h1>
<p>An almanac is a book of dates. This one is a book of Tuesdays.</p>
<p>Every Tuesday for four years I have walked the same three miles of the saltmarsh with a
tide table in my coat and a notebook that has needed a new spine twice. What I record is this:
the hour the water turned, the hour it reached the second line of posts, how the grass had
bent, which birds were standing in the shallow, and what the barnacles were doing at the
height of the mark. A barnacle closed and underwater is counting; a barnacle open and dry is
waiting for the sea to come back.</p>
<p>The marsh is mostly not beautiful. It is grey, it is flat, and the only interesting thing
about it is that it is in the middle of everything else: the <a href="kelp-forest.zz">kelp
forest</a> is under it, the <a href="tidepool.zz">tidepool</a> is off it, and the gulls come
over it at low water. Three tides a day, and the whole of my week arranged around them.</p>
<p>Cleo has a <a href="shell-phonebook.zz">phonebook of shells</a> that I consult more than I
consult people. And in the last week of every year I write down the number of
<a href="gull-counts.zz">gulls</a>, which Ada has never once managed to finish counting.</p>`,
  },
  {
    address: 'hermit-crabs.zz',
    title: 'Hermit Crabs',
    author: 'Cleo',
    html: `<h1>Hermit Crabs</h1>
<p>A hermit crab is a crab that lives in a dead snail's house, and the interesting part is not
the crab. It is that it will not change house for a good reason, and the reason is usually that
the new one is slightly too big.</p>
<p>Shell fitting is a matter of arithmetic and nerve. A crab that picks a shell too large cannot
carry it; one that picks too small is stuck with it, and the crab does grow. So the crab tries a
shell, walks in, checks whether it can still reach the shell's lip with its claws - if it can, it
is too big - and comes back out. It repeats this perhaps twenty times and then, usually, it
chooses the one that is nearly right. Nearly right is the whole arrangement. A crab that waited
for perfect would wait forever.</p>
<p>I have watched this for hours. The <a href="shell-phonebook.zz">phonebook</a> I keep lists
the empty shells I have found and who was wearing them last. I have followed one particular
whelk from the middle of the pool to the high water mark over three days.</p>
<p>Dev keeps an <a href="otter-ledger.zz">account of otters</a> that counts things of a different
kind. Between us we have the shore more or less written down, which is probably not a service
anyone needs.</p>
<p>Further out, past where the light goes, there is <a href="nowhere-in-particular.zz">a place
that is not anywhere in particular</a>, and the crabs there are said to be enormous.</p>`,
  },
  {
    address: 'shell-phonebook.zz',
    title: 'Shell Phonebook',
    author: 'Cleo',
    html: `<h1>Shell Phonebook</h1>
<p>It is a directory of shells, and it is arranged by who is wearing them.</p>
<p>Each entry is a shell - whelk, periwinkle, limpet - with the number I marked on it in
chinagraph pencil, the size, where it was found, and the crab or hermit that was carrying it.
Some of these animals have been in the same shell for a year or more, and I know them by their
walk.</p>
<p>The point of the arrangement is that a shell is a house, and a house has an address, and an
address is what you write down when you want somebody to be found. I know that it is
sentimental. I have been told it is sentimental by people who have never watched a crab decide.
If you want the unsentimental version, the <a href="hermit-crabs.zz">notes on shell fitting</a>
are the same observations without the names.</p>
<p>Some entries are for shells whose wearer is dead, and those are the ones I keep longest. An
empty whelk on the sand is a house with the door open. Nobody has taken it. The sea comes and
goes around it all day.</p>
<p>Bram's <a href="saltmarsh-almanac.zz">book of Tuesdays</a> has a table of times for the same
shore, and <a href="dust-and-salt.zz">Fay's essay</a> is the best thing anybody here has
written about any of it.</p>`,
  },
  {
    address: 'otter-ledger.zz',
    title: 'Otter Ledger',
    author: 'Dev',
    html: `<h1>Otter Ledger</h1>
<p>An otter eats what it catches and forgets what it caught, which makes an otter the worst
possible animal to write about and the best possible animal to have a ledger about.</p>
<p>So I keep the ledger for the otter. It is not what the otter ate. It is what the otter left:
the shells that came up crushed and floating, the stones turned over on the seabed that had not
been turned before, the five or six places along the bank where the spraint is fresh. I walk the
same two miles every morning and I mark what has changed. I have been doing it long enough that
the ledger has its own shape: a repeating pattern of favourite places, with gaps where the otter
went somewhere I did not think to look.</p>
<p>It is a strange document to keep. Nobody asked for it. I read it back sometimes and I cannot
tell whether I am recording a habit or inventing one.</p>
<p>The <a href="anchorite.zz">anchorite</a> I wrote about last winter is the only other page
here that comes close to this kind of obsession, and I am aware that is a dangerous comparison
to make. The <a href="moon-ledger.zz">moon ledger</a> is the coldest reading I know of, and I
go back to it when I have had a bad morning. There is a word for what we all do here, which is
<a href="dust-and-salt.zz">dust and salt</a>.</p>
<p>The otter does not appear in the <a href="gull-counts.zz">gull counts</a> at all, which I
take as evidence that the gulls are not counting either.</p>`,
  },
  {
    address: 'anchorite.zz',
    title: 'Anchorite',
    author: 'Dev',
    html: `<h1>Anchorite</h1>
<p>He came ashore at the winter flood and did not go back, and nobody knows what to call him, so
I called him after the word I had in my head, which was anchorite: one who has anchored himself,
and stays.</p>
<p>That was two winters ago. He lived in the boat shed at first and then in a tent below the
high water mark, which is a foolish place to live, and he moved further down the beach each
winter and further from the sea, as though the sea were something he was slowly walking away from
rather than something that had put him here.</p>
<p>He wrote on the shells he found, using a stub of pencil, and I copied what I could read
before the salt took it. Most of it is weather. Some of it is a list of boats, with dates, and
whether they had passed. I have never worked out whether it is a record of what he missed or a
record of what he was keeping track of.</p>
<p>The <a href="otter-ledger.zz">account of otters</a> is mine, and he read it once, standing, in
the rain. He said: you are counting a thing that counts itself. I have thought about that every
day since.</p>
<p>The <a href="gull-counts.zz">gulls</a> came inland that winter, the way they do when the
<a href="drowned-forest.zz">drowned forest</a> is showing.</p>`,
  },
  {
    address: 'moon-ledger.zz',
    title: 'Moon Ledger',
    author: 'Esme',
    html: `<h1>Moon Ledger</h1>
<p>I record the moon. Once a night, at the same hour whatever the weather, I write the date and
what the moon was doing, and then I write one true sentence about my day.</p>
<p>That is the whole method. The moon part is the easy part: it is either there or it is not, it
is either lit or it is not, and the only judgement required is how much of it was visible
through the cloud. The sentence is the hard part, and the reason for the ledger, because a
ledger of dates and phases is a document with no content, and a ledger with one true sentence in
each line is a document that can be read.</p>
<p>I have 1,102 lines. I have read them back on the anniversary and found that the sentences get
shorter as the years go on, and that I stopped writing about other people some time ago without
noticing when.</p>
<p>Dev keeps an <a href="otter-ledger.zz">account of otters</a> on the same shore and Bram keeps a
<a href="saltmarsh-almanac.zz">book of Tuesdays</a>, and between the three of us we have this coast
written down more carefully than any coast deserves. Ada wrote
<a href="the-tiny-internet.zz">the tiny internet</a>, which is the only one of the four of us
that reads like an essay rather than a list, and it is the one I would save.</p>
<p>I go out at the same hour whether or not the moon is there. That is the point of the ledger.
On the nights when there is nothing to see, I write that there was nothing to see, and that is
also a true sentence about my day.</p>`,
  },
  {
    address: 'low-tide-almanac.zz',
    title: 'Low Tide Almanac',
    author: 'Esme',
    html: `<h1>Low Tide Almanac</h1>
<p>Every tide has two moments that matter: the bottom, and the bottom of the bottom. This book
is about the second one.</p>
<p>Low tide is when the sea gives up the most, and everyone thinks of low tide as the exposed
hour - the hour of flat sand and stranded weed and the crabs caught out and walking, badly, for
their lives. But the true low is a single minute, and it happens on a different day every
month, and if you are on that beach at that minute you will see the shape of the whole bay,
including the parts that are usually under water and usually not to be walked on.</p>
<p>I have marked every true low for eleven years. The tables are in here, and with them a set of
notes on what was exposed: the second rock, the channel, the bar that comes up in the first week
of the spring tides and takes people by surprise.</p>
<p>Bram has been doing the same walk for longer with a different instrument -
<a href="saltmarsh-almanac.zz">his book of Tuesdays</a> - and I have never managed to
convince him that the true low is a different thing from the lowest of several days. We argue
about it in the margins of each other's books.</p>
<p>From the true low you can see the edge of the <a href="kelp-forest.zz">kelp forest</a> and,
on a clear afternoon, the place where the
<a href="the-lost-lighthouse.zz">lost lighthouse</a> is supposed to be.</p>`,
  },
  {
    address: 'dust-and-salt.zz',
    title: 'Dust and Salt',
    author: 'Fay',
    html: `<h1>Dust and Salt</h1>
<p>Here is what this place is made of. Two things, and they are not equal.</p>
<p>The salt is the loud one. It comes in, it goes out, it leaves a white bloom on every rail and
window in the town, and it gets into the air and into the walls and into people. The dust is the
quiet one. It is the rock, the shells, the bone, the dried weed, the powder of every thing that
was here before and is now smaller. It comes off the shore on an easterly and gets into
everything, and it does not come off.</p>
<p>Between the two of them they have taken this town apart and put it together again in a
different shape, and they will do it again. The town will be saltier and grittier in fifty years
than it was in the last fifty, and nobody will notice, because the change is the kind that only
shows if you were here.</p>
<p>Everyone here writes it down. Ada writes about the <a href="the-tiny-internet.zz">tiny
internet</a>, which is this, more or less. Bram writes his
<a href="saltmarsh-almanac.zz">book of Tuesdays</a>. Dev writes about
<a href="otter-ledger.zz">an otter</a> and an <a href="anchorite.zz">anchorite</a>. Esme
writes about <a href="moon-ledger.zz">the moon</a> and about
<a href="low-tide-almanac.zz">the lowest tides</a>. Cleo keeps a
<a href="shell-phonebook.zz">phonebook of shells</a>.</p>
<p>And in the <a href="tidepool.zz">tidepool</a> at the north end, the sea hands back a little of
it twice a day, and takes it away again, and no one has ever worked out who is keeping count.</p>`,
  },
];

/**
 * An hour of browsing, across four of the six people.
 *
 * Dev has been nearly everywhere and is still going - his cursor sits in
 * the middle of his trail, so Forward is available from the first launch.
 * Ada navigated away from a point in the middle of hers, so the forward
 * entries she lost are on screen, marked as lost, from the first launch.
 */
export const ARRIVALS: Record<string, SeedArrival[]> = {
  dev: [
    { address: 'tidepool.zz', via: 'typed', minute: 0 },
    { address: 'kelp-forest.zz', via: 'link', minute: 1 },
    { address: 'hermit-crabs.zz', via: 'link', minute: 2 },
    { address: 'shell-phonebook.zz', via: 'link', minute: 3 },
    { address: 'dust-and-salt.zz', via: 'link', minute: 4 },
    { address: 'the-tiny-internet.zz', via: 'link', minute: 5 },
    { address: 'search:ledger', via: 'search', minute: 6 },
    { address: 'otter-ledger.zz', via: 'link', minute: 7 },
    { address: 'anchorite.zz', via: 'link', minute: 8 },
    { address: 'moon-ledger.zz', via: 'link', minute: 9 },
    { address: 'low-tide-almanac.zz', via: 'link', minute: 10 },
    { address: 'saltmarsh-almanac.zz', via: 'typed', minute: 11 },
    { address: 'gull-counts.zz', via: 'link', minute: 12 },
    { address: 'tidepool.zz', via: 'typed', minute: 13 },
    { address: 'ghost-reef.zz', via: 'link', minute: 14 },
    { address: 'shell-phonebook.zz', via: 'link', minute: 15 },
  ],
  ada: [
    { address: 'tidepool.zz', via: 'typed', minute: 0 },
    { address: 'gull-counts.zz', via: 'link', minute: 1 },
    { address: 'the-tiny-internet.zz', via: 'link', minute: 2 },
    { address: 'dust-and-salt.zz', via: 'link', minute: 3 },
    { address: 'tidepool.zz', via: 'link', minute: 4 },
    { address: 'search:almanac', via: 'search', minute: 5 },
    { address: 'saltmarsh-almanac.zz', via: 'link', minute: 6 },
    { address: 'low-tide-almanac.zz', via: 'link', minute: 7 },
    { address: 'kelp-forest.zz', via: 'link', minute: 8, pruned: true },
    { address: 'hermit-crabs.zz', via: 'link', minute: 9, pruned: true },
    { address: 'shell-phonebook.zz', via: 'link', minute: 10, pruned: true },
    { address: 'otter-ledger.zz', via: 'typed', minute: 11 },
  ],
  bram: [
    { address: 'kelp-forest.zz', via: 'publish', minute: 0 },
    { address: 'saltmarsh-almanac.zz', via: 'link', minute: 2 },
    { address: 'tidepool.zz', via: 'link', minute: 3 },
    { address: 'gull-counts.zz', via: 'link', minute: 5 },
    { address: 'anchorite.zz', via: 'link', minute: 7 },
    { address: 'dust-and-salt.zz', via: 'link', minute: 9 },
    { address: 'shell-phonebook.zz', via: 'link', minute: 11 },
    { address: 'hermit-crabs.zz', via: 'link', minute: 13 },
    { address: 'moon-ledger.zz', via: 'typed', minute: 15 },
    { address: 'low-tide-almanac.zz', via: 'link', minute: 17 },
    { address: 'the-tiny-internet.zz', via: 'link', minute: 19 },
  ],
  esme: [
    { address: 'moon-ledger.zz', via: 'typed', minute: 0 },
    { address: 'low-tide-almanac.zz', via: 'link', minute: 2 },
    { address: 'saltmarsh-almanac.zz', via: 'link', minute: 4 },
    { address: 'kelp-forest.zz', via: 'link', minute: 6 },
    { address: 'the-tiny-internet.zz', via: 'link', minute: 8 },
    { address: 'search:ledger', via: 'search', minute: 10 },
    { address: 'otter-ledger.zz', via: 'link', minute: 12 },
    { address: 'anchorite.zz', via: 'link', minute: 14 },
    { address: 'dust-and-salt.zz', via: 'link', minute: 16 },
    { address: 'tidepool.zz', via: 'link', minute: 18 },
    { address: 'gull-counts.zz', via: 'typed', minute: 20 },
  ],
};

/**
 * Where each person's cursor sits in their trail.
 *
 * Dev's is in the middle, so Forward is there from the first launch.
 * Everyone else's is at the end, which is where you are when you have just
 * arrived somewhere.
 */
export const CURSOR: Record<string, number> = {
  dev: 7,
  ada: 11,
  bram: 10,
  esme: 10,
};
