import { describe, expect, it } from 'vitest';

import {
  buildSnippet,
  decodeEntities,
  deriveSearchText,
  foldQuery,
  foldTerm,
  htmlToText,
} from './search.js';

describe('htmlToText', () => {
  it('strips tags', () => {
    expect(htmlToText('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('decodes entities', () => {
    expect(htmlToText('<p>crab &amp; kelp</p>')).toBe('crab & kelp');
  });

  it('collapses whitespace', () => {
    expect(htmlToText('<p>one\n\n   two</p>')).toBe('one two');
  });

  it('drops script bodies', () => {
    expect(htmlToText('<p>keep</p><script>var dropped = 1;</script>')).toBe('keep');
  });

  it('drops style bodies', () => {
    expect(htmlToText('<style>p { color: red }</style><p>keep</p>')).toBe('keep');
  });

  it('drops comments', () => {
    expect(htmlToText('<!-- a note -->text')).toBe('text');
  });

  it('keeps text that has no markup at all', () => {
    expect(htmlToText('just words')).toBe('just words');
  });
});

describe('decodeEntities', () => {
  it('decodes named entities', () => {
    expect(decodeEntities('a &amp; b &lt;c&gt;')).toBe('a & b <c>');
  });

  it('decodes numeric entities', () => {
    expect(decodeEntities('caf&#233;')).toBe('café');
  });

  it('decodes hexadecimal entities', () => {
    expect(decodeEntities('&#x27;quoted&#x27;')).toBe("'quoted'");
  });

  it('leaves an unknown entity alone', () => {
    expect(decodeEntities('&notarealentity;')).toBe('&notarealentity;');
  });
});

describe('foldTerm', () => {
  it('folds a plural tide', () => {
    expect(foldTerm('tides')).toBe('tide');
  });

  it('folds a plural ledger', () => {
    expect(foldTerm('ledgers')).toBe('ledger');
  });

  it('folds a plural ending in y', () => {
    expect(foldTerm('berries')).toBe('berry');
  });

  it('folds a plural ending in es', () => {
    expect(foldTerm('boxes')).toBe('box');
  });

  it('leaves a singular alone', () => {
    expect(foldTerm('tide')).toBe('tide');
  });

  it('leaves a word ending in ss alone', () => {
    expect(foldTerm('moss')).toBe('moss');
  });

  it('lowercases', () => {
    expect(foldTerm('Tide')).toBe('tide');
  });
});

describe('deriveSearchText', () => {
  it('includes the title and the body', () => {
    const text = deriveSearchText('Tidepool', '<p>Shallow water.</p>');

    expect(text).toContain('tidepool');
    expect(text).toContain('shallow');
  });

  it('folds plurals', () => {
    const text = deriveSearchText('Tidepool', '<p>The tides come in.</p>');

    expect(text).toContain('tide');
    expect(text).not.toContain('tides');
  });

  it('drops stop words', () => {
    const text = deriveSearchText('The Tidepool', '<p>It is a place.</p>');

    expect(text).not.toContain(' the ');
    expect(text).not.toContain(' is ');
  });

  it('drops markup', () => {
    const text = deriveSearchText('Tidepool', '<p class="x">Shallow</p>');

    expect(text).not.toContain('class');
    expect(text).toContain('shallow');
  });
});

describe('foldQuery', () => {
  it('folds the query the same way as the text', () => {
    expect(foldQuery('tides')).toEqual(['tide']);
  });

  it('drops stop words from the query', () => {
    expect(foldQuery('the tidepool')).toEqual(['tidepool']);
  });

  it('handles several words', () => {
    expect(foldQuery('kelp forest')).toEqual(['kelp', 'forest']);
  });
});

describe('buildSnippet', () => {
  const text = deriveSearchText(
    'Otter Ledger',
    '<p>An otter keeps a ledger of every shell it has found along the shore, ' +
      'and the ledger grows longer every season.</p>',
  );

  it('shows the text around the matching term', () => {
    const snippet = buildSnippet(text, 'ledger');

    expect(snippet).toContain('ledger');
    expect(snippet.length).toBeLessThanOrEqual(140);
  });

  it('is collapsed to one line', () => {
    const snippet = buildSnippet(text, 'ledger');

    expect(snippet).not.toContain('\n');
    expect(snippet).not.toContain('  ');
  });

  it('marks a passage that was cut at the start', () => {
    // "shore" sits well into the text, so a narrow window cuts the start off.
    const snippet = buildSnippet(text, 'shore', 5);

    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet).toContain('shore');
  });

  it('falls back to the opening when nothing matches', () => {
    const snippet = buildSnippet(text, 'zeppelin');

    expect(snippet.length).toBeGreaterThan(0);
    expect(snippet).not.toContain('zeppelin');
  });
});
