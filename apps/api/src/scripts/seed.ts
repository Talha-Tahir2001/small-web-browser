import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// mongoose is CommonJS, so under ESM its named exports are not available at
// runtime; the default import is the module object, and that is what we want.
import mongoose from 'mongoose';

import { deriveSearchText, resolveKind } from '@small-web-browser/shared';

import { ARRIVALS, BASE_TIME, CURSOR, PEOPLE, SITES } from './seed-data.js';

/**
 * The seed command.
 *
 * `npm run seed` from the repository root (or `node dist/scripts/seed.js`
 * from apps/api). Add `--reset` to rebuild the web from nothing.
 *
 * The seed is *repeatable* in the strongest sense: running it twice changes
 * nothing, and the data it produces is byte-identical every time. Two
 * things make that true.
 *
 *   - Every document has a deterministic id, derived from a stable key by
 *     a hash. So the second run finds the same documents rather than
 *     creating new ones, and the web does not double.
 *   - Nothing is timestamped with `now()`. Every arrival is timed from a
 *     fixed epoch, so the same history happens at the same times, and the
 *     walk in the recording can be walked again.
 */

/** A deterministic id for a stable key. */
function idFor(key: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(createHash('sha1').update(key).digest('hex').slice(0, 24));
}

/** The time an arrival happened, from the fixed epoch. */
function timeAt(minute: number): Date {
  return new Date(BASE_TIME + minute * 60_000);
}

const COLLECTIONS = ['people', 'sites', 'visits', 'browserStates'] as const;

export type SeedCounts = {
  people: number;
  sites: number;
  visits: number;
  browserStates: number;
};

/**
 * Seed the web.
 *
 * This opens its own connection rather than using the default one, so that
 * it can be run inside a test that already has an application connected -
 * and so that seeding never disturbs a running server.
 */
export async function runSeed(options: {
  uri: string;
  reset: boolean;
}): Promise<SeedCounts> {
  const { uri, reset } = options;

  const connection = await mongoose.createConnection(uri).asPromise();
  const db = connection.db;

  if (!db) {
    throw new Error('Could not reach the database.');
  }


  const personIdBySlug = new Map<string, mongoose.Types.ObjectId>();
  const siteIdByAddress = new Map<string, mongoose.Types.ObjectId>();

  // --- people -----------------------------------------------------------
  await db.collection('people').bulkWrite(
    PEOPLE.map((person) => ({
      updateOne: {
        filter: { _id: idFor(`person:${person.slug}`) },
        update: { $setOnInsert: { name: person.name, slug: person.slug } },
        upsert: true,
      },
    })),
  );

  for (const person of PEOPLE) {
    personIdBySlug.set(person.slug, idFor(`person:${person.slug}`));
  }

  // --- sites ------------------------------------------------------------
  // The text index and the unique address are created by the application
  // when it connects, but the seed creates them too: seeding before the
  // app has ever run should still leave a searchable web.
  await db.collection('sites').bulkWrite(
    SITES.map((site, index) => {
      const authorId = idFor(`person:${slugOf(site.author)}`);
      const publishedAt = new Date(BASE_TIME - (index + 1) * 86_400_000);

      return {
        updateOne: {
          filter: { _id: idFor(`site:${site.address}`) },
          update: {
            $setOnInsert: {
              address: site.address,
              title: site.title,
              html: site.html,
              searchText: deriveSearchText(site.title, site.html),
              authorId,
              publishedAt,
              updatedAt: publishedAt,
              version: 1,
            },
          },
          upsert: true,
        },
      };
    }),
  );

  for (const site of SITES) {
    siteIdByAddress.set(site.address, idFor(`site:${site.address}`));
  }

  // --- visits -----------------------------------------------------------
  // Every arrival gets its own document, with the snapshot of what was on
  // screen at the time. The seed builds the same snapshots the running
  // server would.
  const stackBySlug = new Map<string, mongoose.Types.ObjectId[]>();

  for (const [slug, arrivals] of Object.entries(ARRIVALS)) {
    const personId = personIdBySlug.get(slug);
    if (!personId) continue;

    const stack: mongoose.Types.ObjectId[] = [];

    await db.collection('visits').bulkWrite(
      arrivals.map((arrival, index) => {
        const visitId = idFor(`visit:${slug}:${index}`);
        if (!arrival.pruned) stack.push(visitId);

        const isSearch = arrival.address.startsWith('search:');
        const query = isSearch ? arrival.address.slice('search:'.length) : null;

        const site = isSearch ? null : siteIdByAddress.get(arrival.address);
        const siteExists = Boolean(site);
        const kind = isSearch ? 'search' : resolveKind(arrival.address, siteExists);

        const title = isSearch
          ? `Search: ${query}`
          : kind === 'page'
            ? (SITES.find((s) => s.address === arrival.address)?.title ?? arrival.address)
            : kind === 'notfound'
              ? `No such address: ${arrival.address}`
              : 'That address is not part of this web';

        const html = isSearch
          ? null
          : kind === 'page'
            ? (SITES.find((s) => s.address === arrival.address)?.html ?? null)
            : null;

        return {
          updateOne: {
            filter: { _id: visitId },
            update: {
              $setOnInsert: {
                personId,
                address: arrival.address,
                kind,
                title,
                via: arrival.via,
                referrerAddress: null,
                visitedAt: timeAt(arrival.minute),
                snapshot: {
                  title,
                  html,
                  query,
                  resultAddresses: [],
                  errorCode: kind === 'notfound' ? 'notfound' : kind === 'offweb' ? 'offweb' : null,
                },
                pruned: Boolean(arrival.pruned),
              },
            },
            upsert: true,
          },
        };
      }),
    );

    stackBySlug.set(slug, stack);
  }

  // --- the navigable stacks --------------------------------------------
  for (const [slug, entries] of stackBySlug) {
    const personId = personIdBySlug.get(slug);
    if (!personId) continue;

    const cursor = Math.min(CURSOR[slug] ?? entries.length - 1, Math.max(0, entries.length - 1));

    await db.collection('browserStates').bulkWrite([
      {
        updateOne: {
          filter: { _id: idFor(`state:${slug}`) },
          update: {
            $setOnInsert: {
              personId,
              entries,
              cursor,
              updatedAt: new Date(BASE_TIME),
            },
          },
          upsert: true,
        },
      },
    ]);
  }

  // --- indexes ----------------------------------------------------------
  await db.collection('people').createIndex({ name: 1 }, { unique: true });
  await db.collection('people').createIndex({ slug: 1 }, { unique: true });
  await db.collection('sites').createIndex({ address: 1 }, { unique: true });
  await db.collection('sites').createIndex(
    { title: 'text', searchText: 'text' },
    { weights: { title: 10, searchText: 1 }, name: 'site_text' },
  );
  await db.collection('visits').createIndex({ personId: 1, visitedAt: 1 });
  await db.collection('visits').createIndex({ personId: 1, pruned: 1 });
  await db.collection('browserStates').createIndex({ personId: 1 }, { unique: true });

  const counts: SeedCounts = {
    people: await db.collection('people').countDocuments(),
    sites: await db.collection('sites').countDocuments(),
    visits: await db.collection('visits').countDocuments(),
    browserStates: await db.collection('browserStates').countDocuments(),
  };

  await connection.close();

  return counts;
}

/** The seed command, as it is run from the command line. */
async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/wyxan';
  const reset = process.argv.includes('--reset');

  if (reset) {
    const connection = await mongoose.createConnection(uri).asPromise();
    for (const name of COLLECTIONS) {
      await connection.db?.collection(name).deleteMany({});
    }
    await connection.close();
    console.log('Reset: cleared people, sites, visits and browser states.');
  }

  const counts = await runSeed({ uri, reset: false });

  console.log(
    `Seeded ${counts.people} people, ${counts.sites} sites, ${counts.visits} arrivals and ` +
      `${counts.browserStates} history stacks.`,
  );
}

/** The slug of a person, from their name. */
function slugOf(name: string): string {
  return name.toLowerCase();
}

// Only run the command when this file is the one being run, so that a test
// can import `runSeed` without the command line firing as well.
const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  seed().catch((error: unknown) => {
    console.error('The seed failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
