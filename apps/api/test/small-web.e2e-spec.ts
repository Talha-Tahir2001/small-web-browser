import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { runSeed } from '../src/scripts/seed.js';

/**
 * The API, against a real database.
 *
 * These are the behaviours the brief calls non-negotiable, written down as
 * tests rather than as claims: publishing and its conflict, searching what
 * was published, restoring a page that has since been replaced, and losing
 * forward at the right moment.
 */
describe('the small web, end to end', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let connection: Connection;
  let personId: string;

  const address = 'tidepool.zz';
  const html = '<h1>Tidepool</h1><p>Shallow water holds the light.</p>';

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri('wyxan');

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    connection = app.get<Connection>(getConnectionToken());

    // People are seeded rather than created, but the tests need one.
    const inserted = await connection
      .collection('people')
      .insertOne({ name: 'Tester', slug: 'tester' });
    personId = inserted.insertedId.toString();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  const publish = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/api/sites').send(body);

  const arrive = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/api/visits').send(body);

  describe('publishing', () => {
    it('publishes a page', async () => {
      const response = await publish({
        address: 'tidepool',
        title: 'Tidepool',
        html,
        authorId: personId,
      }).expect(201);

      expect(response.body.address).toBe(address);
      expect(response.body.version).toBe(1);
    });

    it('refuses to publish over a page that is already there, and suggests one', async () => {
      const response = await publish({
        address: 'tidepool',
        title: 'Tidepool again',
        html,
        authorId: personId,
      }).expect(409);

      expect(response.body.message).toContain(address);
      expect(response.body.suggestion).toBe('tidepool-2.zz');
    });

    it('makes the text of the page findable', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/search')
        .query({ q: 'shallow' })
        .expect(200);

      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.results[0].address).toBe(address);
      expect(response.body.results[0].snippet).toContain('Shallow');
    });
  });

  describe('navigating', () => {
    it('arrives at a page and snapshots it', async () => {
      const response = await arrive({
        personId,
        address: 'tidepool',
        via: 'typed',
      }).expect(201);

      expect(response.body.visit.kind).toBe('page');
      expect(response.body.visit.snapshot.html).toContain('Shallow water');
      expect(response.body.state.cursor).toBe(0);
    });

    it('records an arrival at an address that leads nowhere', async () => {
      const response = await arrive({
        personId,
        address: 'ghost-reef.zz',
        via: 'link',
      }).expect(201);

      expect(response.body.visit.kind).toBe('notfound');
      expect(response.body.visit.snapshot.errorCode).toBe('notfound');
    });

    it('keeps an address outside the web a different failure', async () => {
      const response = await arrive({
        personId,
        address: 'example.com',
        via: 'typed',
      }).expect(201);

      expect(response.body.visit.kind).toBe('offweb');
      expect(response.body.visit.snapshot.errorCode).toBe('offweb');
    });
  });

  describe('restoring a page', () => {
    it('shows the page as it was, even after the page is replaced', async () => {
      // A page of our own, so the test does not depend on what other tests
      // have published.
      await publish({
        address: 'kelp-forest.zz',
        title: 'Kelp Forest',
        html: '<h1>Kelp Forest</h1><p>The kelp grows in long brown ribbons.</p>',
        authorId: personId,
      }).expect(201);

      const arrival = await arrive({
        personId,
        address: 'kelp-forest.zz',
        via: 'typed',
      }).expect(201);

      // Go somewhere else, so that going back is a real move.
      await arrive({ personId, address: 'hermit-crabs.zz', via: 'typed' }).expect(201);

      // Replace the page while the reader is somewhere else.
      await publish({
        address: 'kelp-forest.zz',
        title: 'Kelp Forest',
        html: '<h1>Kelp Forest</h1><p>The light has moved on.</p>',
        authorId: personId,
        replace: true,
      }).expect(201);

      // Going back replays the snapshot, not the new page.
      const back = await request(app.getHttpServer())
        .post('/api/history/back')
        .send({ personId })
        .expect(200);

      expect(back.body.visit.visitId).toBe(arrival.body.visit.visitId);
      expect(back.body.visit.snapshot.html).toContain('long brown ribbons');
      expect(back.body.visit.snapshot.html).not.toContain('moved on');
    });
  });

  describe('losing forward', () => {
    it('loses the forward entries when you navigate after going back', async () => {
      await arrive({ personId, address: 'kelp-forest.zz', via: 'typed' }).expect(201);
      await arrive({ personId, address: 'hermit-crabs.zz', via: 'typed' }).expect(201);

      await request(app.getHttpServer()).post('/api/history/back').send({ personId }).expect(200);

      // Navigate somewhere new from the middle of the trail.
      await arrive({ personId, address: 'shell-phonebook.zz', via: 'typed' }).expect(201);

      // Forward is gone.
      await request(app.getHttpServer()).post('/api/history/forward').send({ personId }).expect(204);

      const history = await request(app.getHttpServer())
        .get('/api/history')
        .query({ personId })
        .expect(200);

      expect(history.body.lostCount).toBeGreaterThan(0);
      expect(history.body.canGoForward).toBe(false);
    });

    it('discards the forward entries when you jump to an older one', async () => {
      const before = await request(app.getHttpServer())
        .get('/api/history')
        .query({ personId })
        .expect(200);

      const target = Math.max(0, before.body.cursor - 1);

      const jump = await request(app.getHttpServer())
        .post('/api/history/jump')
        .send({ personId, index: target })
        .expect(200);

      expect(jump.body.state.cursor).toBe(target);
      expect(jump.body.pruned.length).toBeGreaterThan(0);
      expect(jump.body.state.canGoForward).toBe(false);
    });

    it('refuses a jump to nowhere', async () => {
      await request(app.getHttpServer())
        .post('/api/history/jump')
        .send({ personId, index: 9999 })
        .expect(400);
    });
  });

  describe('the render endpoint', () => {
    it('serves a snapshot with the containment headers', async () => {
      const visit = await arrive({ personId, address: 'tidepool', via: 'typed' }).expect(201);

      const response = await request(app.getHttpServer())
        .get(`/render/${visit.body.visit.visitId}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.headers['content-security-policy']).toContain("default-src 'none'");
      expect(response.headers['content-security-policy']).toContain('sandbox allow-scripts');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe('no-referrer');
      expect(response.headers['cache-control']).toBe('no-store');
    });

    it('serves the page that was on screen, not the live page', async () => {
      await publish({
        address: 'dust-and-salt.zz',
        title: 'Dust and Salt',
        html: '<h1>Dust and Salt</h1><p>Two things, and they are not equal.</p>',
        authorId: personId,
      }).expect(201);

      const visit = await arrive({ personId, address: 'dust-and-salt.zz', via: 'typed' }).expect(201);

      await publish({
        address: 'dust-and-salt.zz',
        title: 'Dust and Salt',
        html: '<h1>Dust and Salt</h1><p>A different page entirely.</p>',
        authorId: personId,
        replace: true,
      }).expect(201);

      const response = await request(app.getHttpServer())
        .get(`/render/${visit.body.visit.visitId}`)
        .expect(200);

      expect(response.text).toContain('not equal');
      expect(response.text).not.toContain('different page');
    });
  });

  describe('the seed', () => {
    it('running it twice does not double the web', async () => {
      const uri = mongo.getUri('wyxan-seed');

      const first = await runSeed({ uri, reset: true });
      const second = await runSeed({ uri, reset: false });

      expect(second).toEqual(first);
      expect(first.people).toBe(6);
      expect(first.sites).toBe(12);
      expect(first.visits).toBeGreaterThan(0);
    });
  });
});
