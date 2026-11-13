import { describe, expect, it } from 'vitest';

import { validatePublish } from './publish-validation.js';

const LIMIT = 65536;

function publish(overrides: Partial<Parameters<typeof validatePublish>[0]> = {}) {
  return validatePublish(
    { address: 'tidepool', title: 'Tidepool', html: '<p>Shallow water.</p>', ...overrides },
    LIMIT,
  );
}

describe('validatePublish', () => {
  describe('rule 1: the address', () => {
    it('accepts a bare name', () => {
      const result = publish();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.address).toBe('tidepool.zz');
    });

    it('accepts an address with a path', () => {
      const result = publish({ address: 'tidepool.zz/tide-pools' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.address).toBe('tidepool.zz/tide-pools');
    });

    it('rejects an address outside the web', () => {
      const result = publish({ address: 'example.com' });

      expect(result).toEqual({
        ok: false,
        error: 'That is not an address this web can hold.',
      });
    });

    it('rejects an address that is not an address', () => {
      const result = publish({ address: 'not an address' });

      expect(result.ok).toBe(false);
    });

    it('rejects a missing address', () => {
      const result = publish({ address: null });

      expect(result.ok).toBe(false);
    });
  });

  describe('rule 2: the title', () => {
    it('rejects an empty title', () => {
      const result = publish({ title: '' });

      expect(result).toEqual({ ok: false, error: 'A page needs a title.' });
    });

    it('rejects a title that is only whitespace', () => {
      const result = publish({ title: '   ' });

      expect(result).toEqual({ ok: false, error: 'A page needs a title.' });
    });

    it('accepts a title of exactly 200 characters', () => {
      const result = publish({ title: 'a'.repeat(200) });

      expect(result.ok).toBe(true);
    });

    it('rejects a title of 201 characters', () => {
      const result = publish({ title: 'a'.repeat(201) });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain('201');
    });
  });

  describe('rule 3: the HTML', () => {
    it('rejects empty HTML', () => {
      const result = publish({ html: '' });

      expect(result).toEqual({ ok: false, error: 'A page needs some HTML.' });
    });

    it('accepts HTML of exactly the limit', () => {
      const result = publish({ html: 'x'.repeat(LIMIT) });

      expect(result.ok).toBe(true);
    });

    it('rejects HTML over the limit, and says what the limit is', () => {
      const result = publish({ html: 'x'.repeat(LIMIT + 1) });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain(String(LIMIT));
    });

    it('counts bytes, not characters', () => {
      // Four bytes per emoji, so a handful of them is over a tiny limit.
      const result = validatePublish(
        { address: 'tidepool', title: 'Tidepool', html: '🌊'.repeat(8) },
        16,
      );

      expect(result.ok).toBe(false);
    });
  });

  describe('the order the rules are checked in', () => {
    it('reports the address before the title', () => {
      const result = publish({ address: 'example.com', title: '' });

      expect(result).toEqual({
        ok: false,
        error: 'That is not an address this web can hold.',
      });
    });

    it('reports the title before the HTML', () => {
      const result = publish({ title: '', html: '' });

      expect(result).toEqual({ ok: false, error: 'A page needs a title.' });
    });
  });

  describe('the derived search text', () => {
    it('is derived from the title and the body', () => {
      const result = publish({ title: 'Tidepool', html: '<p>Shallow water holds the light.</p>' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.searchText).toContain('tidepool');
      expect(result.searchText).toContain('shallow');
    });
  });
});
