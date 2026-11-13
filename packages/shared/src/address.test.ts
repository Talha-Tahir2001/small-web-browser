import { describe, expect, it } from 'vitest';

import {
  MAX_ADDRESS_LENGTH,
  hostOf,
  isInWeb,
  normalizeAddress,
  resolveKind,
  resolveLink,
} from './address.js';

/** The normalisation of an input, or a failure. */
function normalise(input: string) {
  const result = normalizeAddress(input);
  if (!result.ok) {
    throw new Error(`expected ${JSON.stringify(input)} to normalise, got: ${result.error}`);
  }
  return result;
}

/** The normalised spelling of an input. */
function address(input: string): string {
  return normalise(input).address;
}

describe('normalizeAddress', () => {
  describe('the worked examples in SPEC 4.2', () => {
    it('resolves a bare name into the web', () => {
      expect(address('tidepool')).toBe('tidepool.zz');
    });

    it('lowercases the whole result', () => {
      expect(address('TIDEPOOL.ZZ')).toBe('tidepool.zz');
    });

    it('accepts an absolute url', () => {
      expect(address('http://tidepool.zz/')).toBe('tidepool.zz');
    });

    it('keeps a path', () => {
      expect(address('https://tidepool.zz/tide-pools')).toBe('tidepool.zz/tide-pools');
    });

    it('drops a trailing slash', () => {
      expect(address('tidepool.zz/')).toBe('tidepool.zz');
    });

    it('drops a fragment', () => {
      expect(address('tidepool.zz#section')).toBe('tidepool.zz');
    });

    it('re-enters the address when the app url is pasted back in', () => {
      expect(address('http://localhost:3000/tidepool.zz')).toBe('tidepool.zz');
      expect(address('http://127.0.0.1:3000/tidepool.zz')).toBe('tidepool.zz');
    });

    it('keeps an address that has no site behind it', () => {
      // Well-formed and inside the web; whether a site exists is a separate
      // question, answered by resolveKind.
      expect(address('ghost-reef.zz')).toBe('ghost-reef.zz');
    });

    it('keeps a host outside the web', () => {
      expect(address('example.com')).toBe('example.com');
    });

    it('keeps a path on a host outside the web', () => {
      expect(address('http://example.com/x')).toBe('example.com/x');
    });

    it('rejects an empty address', () => {
      expect(normalizeAddress('')).toEqual({
        ok: false,
        error: 'An address cannot be empty.',
      });
      expect(normalizeAddress('   ')).toEqual({
        ok: false,
        error: 'An address cannot be empty.',
      });
    });

    it('rejects an address with a space in it', () => {
      const result = normalizeAddress('tide pool');
      expect(result.ok).toBe(false);
    });
  });

  describe('what is inside the web', () => {
    it('says so for a bare name', () => {
      expect(normalise('tidepool').inWeb).toBe(true);
    });

    it('says so for a host under .zz', () => {
      expect(normalise('tidepool.zz').inWeb).toBe(true);
    });

    it('says so for a path under .zz', () => {
      expect(normalise('tidepool.zz/tide-pools').inWeb).toBe(true);
    });

    it('says no for a host outside the web', () => {
      expect(normalise('example.com').inWeb).toBe(false);
    });

    it('says no when .zz is only part of the host', () => {
      expect(normalise('tidepool.zz.com').inWeb).toBe(false);
    });
  });

  describe('rejections', () => {
    it('rejects a whitespace-only address', () => {
      expect(normalizeAddress('   ').ok).toBe(false);
    });

    it('rejects an address containing a space', () => {
      expect(normalizeAddress('tide pool').ok).toBe(false);
    });

    it('rejects an address containing a tab', () => {
      expect(normalizeAddress('tide\tpool').ok).toBe(false);
    });

    it('rejects an address containing a control character', () => {
      expect(normalizeAddress('tide\u0000pool').ok).toBe(false);
    });

    it('rejects a host with an underscore', () => {
      expect(normalizeAddress('tide_pool.zz').ok).toBe(false);
    });

    it('rejects a host label that starts with a hyphen', () => {
      expect(normalizeAddress('-tidepool.zz').ok).toBe(false);
    });

    it('rejects a host label that ends with a hyphen', () => {
      expect(normalizeAddress('tidepool-.zz').ok).toBe(false);
    });

    it('rejects an address that starts with a slash', () => {
      expect(normalizeAddress('/tidepool.zz').ok).toBe(false);
    });

    it('rejects an address that is too long', () => {
      // Every label is legal; the address as a whole is not.
      const long = `${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.zz`;
      expect(normalizeAddress(long).ok).toBe(false);
    });
  });

  describe('the boundaries of the rules', () => {
    it('accepts an address of exactly the maximum length', () => {
      // 63 + 1 + 53 + 3 = 120 characters, every label within its own limit.
      const exact = `${'a'.repeat(63)}.${'b'.repeat(53)}.zz`;
      expect(exact).toHaveLength(MAX_ADDRESS_LENGTH);
      expect(address(exact)).toBe(exact);
    });

    it('accepts a 63 character host label', () => {
      const label = 'a'.repeat(63);
      expect(address(`${label}.zz`)).toBe(`${label}.zz`);
    });

    it('rejects a 64 character host label', () => {
      const label = 'a'.repeat(64);
      expect(normalizeAddress(`${label}.zz`).ok).toBe(false);
    });

    it('treats a hyphen inside a label as legal', () => {
      expect(address('tide-pool.zz')).toBe('tide-pool.zz');
    });

    it('drops a port', () => {
      expect(address('http://tidepool.zz:8080/x')).toBe('tidepool.zz/x');
    });

    it('drops a query string', () => {
      expect(address('tidepool.zz?a=1')).toBe('tidepool.zz');
    });

    it('keeps a deeper path', () => {
      expect(address('tidepool.zz/a/b')).toBe('tidepool.zz/a/b');
    });

    it('drops a trailing slash from a path', () => {
      expect(address('tidepool.zz/a/')).toBe('tidepool.zz/a');
    });
  });
});

describe('isInWeb', () => {
  it('is true for a host under .zz', () => {
    expect(isInWeb('tidepool.zz')).toBe(true);
  });

  it('is true for a path under .zz', () => {
    expect(isInWeb('tidepool.zz/a')).toBe(true);
  });

  it('is false for another host', () => {
    expect(isInWeb('example.com')).toBe(false);
  });

  it('is false when .zz is only part of the host', () => {
    expect(isInWeb('tidepool.zz.com')).toBe(false);
  });
});

describe('hostOf', () => {
  it('returns the host of a flat address', () => {
    expect(hostOf('tidepool.zz')).toBe('tidepool.zz');
  });

  it('returns the host of an address with a path', () => {
    expect(hostOf('tidepool.zz/a/b')).toBe('tidepool.zz');
  });
});

describe('resolveLink', () => {
  it('resolves a sibling host', () => {
    const result = resolveLink('kelp-forest.zz', 'tidepool.zz');

    expect(result).toEqual({ ok: true, address: 'kelp-forest.zz' });
  });

  it('resolves a sibling host with a path', () => {
    const result = resolveLink('kelp-forest.zz/deep', 'tidepool.zz');

    expect(result).toEqual({ ok: true, address: 'kelp-forest.zz/deep' });
  });

  it('resolves a place inside the current host', () => {
    const result = resolveLink('tide-pools', 'tidepool.zz/tide-pools');

    expect(result).toEqual({ ok: true, address: 'tidepool.zz/tide-pools' });
  });

  it('resolves a root-relative link', () => {
    const result = resolveLink('/kelp-forest.zz', 'tidepool.zz');

    expect(result).toEqual({ ok: true, address: 'kelp-forest.zz' });
  });

  it('resolves an absolute url', () => {
    const result = resolveLink('https://kelp-forest.zz/deep', 'tidepool.zz');

    expect(result).toEqual({ ok: true, address: 'kelp-forest.zz/deep' });
  });

  it('drops the fragment of an absolute url', () => {
    const result = resolveLink('https://kelp-forest.zz/deep#part', 'tidepool.zz');

    expect(result).toEqual({ ok: true, address: 'kelp-forest.zz/deep' });
  });

  it('keeps a link out of the web out of the web', () => {
    const result = resolveLink('example.com', 'tidepool.zz');

    expect(result).toEqual({ ok: true, address: 'example.com' });
  });

  it('refuses a link that is not an address', () => {
    const result = resolveLink('javascript:alert(1)', 'tidepool.zz');

    expect(result.ok).toBe(false);
  });

  it('refuses an empty link', () => {
    const result = resolveLink('   ', 'tidepool.zz');

    expect(result.ok).toBe(false);
  });
});

describe('resolveKind', () => {
  it('is a page when a site exists', () => {
    expect(resolveKind('tidepool.zz', true)).toBe('page');
  });

  it('is notfound when no site exists', () => {
    expect(resolveKind('ghost-reef.zz', false)).toBe('notfound');
  });

  it('is offweb for a host outside the web, whatever exists', () => {
    expect(resolveKind('example.com', true)).toBe('offweb');
    expect(resolveKind('example.com', false)).toBe('offweb');
  });
});
