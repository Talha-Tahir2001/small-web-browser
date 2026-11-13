import { deriveSearchText, normalizeAddress } from '@small-web-browser/shared';

/**
 * The rules a publish request has to satisfy, checked without touching the
 * database.
 *
 * Rules 1 to 3 in SPEC 5.4 are about the request itself: the address, the
 * title and the HTML. They are pulled out here so they can be tested
 * exhaustively without standing up a database - and so that the order in
 * which they are checked is obvious rather than buried in a service method.
 *
 * Rules 4 and 5 (the author must be one of the seeded people, and the
 * address must be free) need the database, so they stay in the service.
 */

export type PublishDraft = {
  address?: string | null;
  title?: string | null;
  html?: string | null;
};

export type ValidatedPublish =
  | { ok: true; address: string; title: string; html: string; searchText: string }
  | { ok: false; error: string };

export const MAX_TITLE_LENGTH = 200;

/**
 * Check a publish request against the rules, in order.
 *
 * The first rule that is not met is the one reported, because that is the
 * thing the person would have to change first.
 */
export function validatePublish(draft: PublishDraft, maxHtmlBytes: number): ValidatedPublish {
  // 1. The address.
  const normalised = normalizeAddress(draft.address ?? '');
  if (!normalised.ok || !normalised.inWeb) {
    return { ok: false, error: 'That is not an address this web can hold.' };
  }

  // 2. The title.
  const title = (draft.title ?? '').trim();
  if (title.length === 0) {
    return { ok: false, error: 'A page needs a title.' };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return {
      ok: false,
      error: `That title is ${title.length} characters long, and the limit is ${MAX_TITLE_LENGTH}.`,
    };
  }

  // 3. The HTML.
  const html = draft.html ?? '';
  const bytes = Buffer.byteLength(html, 'utf8');
  if (bytes === 0) {
    return { ok: false, error: 'A page needs some HTML.' };
  }
  if (bytes > maxHtmlBytes) {
    return {
      ok: false,
      error: `That page is ${bytes} bytes, and the limit is ${maxHtmlBytes}. Publish a shorter page.`,
    };
  }

  return {
    ok: true,
    address: normalised.address,
    title,
    html,
    searchText: deriveSearchText(title, html),
  };
}
