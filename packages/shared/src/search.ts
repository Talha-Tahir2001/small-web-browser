/**
 * Turning a page into something we can search.
 *
 * Two pure functions, both unit-tested, both used by the API:
 *
 *   - `deriveSearchText` decides what goes into the indexed text of a site.
 *     It is done once, at publish time, and never recomputed on read, so the
 *     set of indexed terms stays stable and the query path stays a single
 *     indexed lookup.
 *   - `buildSnippet` decides what a reader sees under a search result.
 *
 * Neither of them touches the author's HTML: the page is stored verbatim, and
 * this is only the text we search over.
 */

/**
 * MongoDB's English stop words.
 *
 * The same list, deliberately: the text index applies its own stop words when
 * it indexes and when it queries, so deriving them out here keeps the stored
 * text and the index saying the same thing.
 */
export const STOP_WORDS: ReadonlySet<string> = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is',
  'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there',
  'these', 'they', 'this', 'to', 'was', 'will', 'with',
]);

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', hellip: '…', lsquo: '‘', rsquo: '’',
  ldquo: '“', rdquo: '”', copy: '©', reg: '®', trade: '™',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', uuml: 'ü',
  ouml: 'ö', auml: 'ä', szlig: 'ß',
};

/**
 * Decode the HTML entities we are likely to meet in prose.
 *
 * Unknown entities are left alone rather than dropped: losing a character the
 * author wrote is worse than carrying one through.
 */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body: string) => {
    if (body.startsWith('#')) {
      const isHex = body[1] === 'x';
      const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return ENTITIES[body.toLowerCase()] ?? match;
  });
}

/**
 * The readable text of a page: no tags, no entities, no runs of whitespace.
 *
 * Script and style bodies are dropped along with their tags - their contents
 * are code, not prose, and searching for "function" should not find every page
 * with a script tag.
 */
export function htmlToText(html: string): string {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, ' ');
  const withoutCode = withoutComments.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ');
  const withoutTags = withoutCode.replace(/<[^>]*>/g, ' ');
  const decoded = decodeEntities(withoutTags);

  return decoded.replace(/\s+/g, ' ').trim();
}

/**
 * Fold a word to a singular-ish stem.
 *
 * This is deliberately light: plurals fold, so `tides` finds `tide` and
 * `ledgers` finds `ledger`. It is not a proper stemmer and does not try to
 * be - the point is that a reader who searches for one spelling finds the
 * other.
 */
export function foldTerm(word: string): string {
  const lower = word.toLowerCase();

  if (lower.length > 4 && lower.endsWith('ies')) {
    return `${lower.slice(0, -3)}y`;
  }
  if (lower.length > 4 && /(ches|shes|xes|zes|ses)$/.test(lower)) {
    return lower.slice(0, -2);
  }
  if (lower.length > 3 && lower.endsWith('s') && !lower.endsWith('ss')) {
    return lower.slice(0, -1);
  }
  return lower;
}

/**
 * The text that gets indexed for a site: its title and its body, lowercased,
 * stop words removed, plurals folded.
 */
export function deriveSearchText(title: string, html: string): string {
  const text = `${title} ${htmlToText(html)}`;
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);

  const folded = words
    .map(foldTerm)
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word));

  return folded.join(' ');
}

/**
 * The query terms, folded the same way the indexed text is.
 */
export function foldQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0)
    .map(foldTerm)
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word));
}

/**
 * A short passage from around the first matching term.
 *
 * The snippet is taken from the indexed text rather than the raw HTML, so it
 * is plain prose - no markup, no tags.
 */
export function buildSnippet(text: string, query: string, radius = 60): string {
  const terms = foldQuery(query);

  for (const term of terms) {
    const index = text.indexOf(term);
    if (index < 0) continue;

    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + term.length + radius);

    let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
    if (start > 0) snippet = `…${snippet}`;
    if (end < text.length) snippet = `${snippet}…`;
    return snippet;
  }

  // Nothing matched: show the opening of the text rather than nothing at all.
  return text.slice(0, radius * 2).replace(/\s+/g, ' ').trim();
}
