/**
 * Address normalisation.
 *
 * An address is the only thing typed into the address bar and the only thing
 * a site author can point at, so its shape has to be decided once, here, and
 * agreed on by both the client (for instant feedback) and the server (which
 * is authoritative and re-normalises everything it is given).
 *
 * The function is pure: same input, same output, no clock, no network, no
 * database. It answers two questions and no more:
 *
 *   1. Is this a well-formed address at all?  -> `{ ok: false, error }`
 *   2. If so, what is its canonical spelling, and is it inside the small web?
 *      -> `{ ok: true, address, inWeb }`
 *
 * Whether an address actually *has* a site behind it is a question about the
 * world, not about syntax, so it is answered separately by `resolveKind` once
 * the site has been looked up. Keeping the two apart is what lets the client
 * preview a navigation without a round trip.
 */

/** The suffix every address in this web carries. */
export const WEB_ROOT = '.zz';

/** Longest address we will accept, in characters. */
export const MAX_ADDRESS_LENGTH = 120;

/** How an address turned out, once it has been resolved against the web. */
export type AddressKind = 'page' | 'notfound' | 'offweb';

export type AddressResult =
  | { ok: true; address: string; inWeb: boolean }
  | { ok: false; error: string };

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const WHITESPACE_OR_CONTROL = /[\s\u0000-\u001F\u007F]/;
const SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * True for hosts that are *this application's* host rather than a host in the
 * small web. Pasting `http://localhost:3000/tidepool.zz` into the address bar
 * is a person copying the URL of the page they are looking at; the address is
 * in the path, not the host.
 */
function isAppHost(host: string): boolean {
  return host === 'localhost' || IPV4.test(host);
}

/** The host part of an already-normalised address. */
export function hostOf(address: string): string {
  const slash = address.indexOf('/');
  return slash >= 0 ? address.slice(0, slash) : address;
}

/**
 * True when the address sits inside the small web.
 *
 * Expects a normalised address; use `normalizeAddress` first if you are not
 * sure. `tidepool.zz` and `tidepool.zz/tide-pools` are in the web;
 * `example.com` and `example.com/x` are not.
 */
export function isInWeb(address: string): boolean {
  return hostOf(address).endsWith(WEB_ROOT);
}

/**
 * Normalise whatever was typed into the address bar.
 *
 * `tidepool`, `TIDEPOOL`, `tidepool.zz`, `http://tidepool.zz/` and
 * `http://localhost:3000/tidepool.zz` all normalise to `tidepool.zz`.
 */
export function normalizeAddress(input: string): AddressResult {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { ok: false, error: 'An address cannot be empty.' };
  }
  if (WHITESPACE_OR_CONTROL.test(trimmed)) {
    return { ok: false, error: 'An address cannot contain spaces.' };
  }

  let host: string;
  let path: string;

  if (SCHEME.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return { ok: false, error: 'That does not look like an address.' };
    }

    host = url.hostname.toLowerCase();
    path = url.pathname.toLowerCase();

    if (isAppHost(host)) {
      // The app's own URL: the address is in the path.
      const inPath = path.startsWith('/') ? path.slice(1) : path;
      const slash = inPath.indexOf('/');
      host = slash >= 0 ? inPath.slice(0, slash) : inPath;
      path = slash >= 0 ? inPath.slice(slash) : '';
      if (host.length === 0) {
        return { ok: false, error: 'That URL does not contain an address.' };
      }
    }
  } else {
    // A bare address: drop any fragment and query, then split host from path.
    let bare = trimmed;
    const hash = bare.indexOf('#');
    if (hash >= 0) bare = bare.slice(0, hash);
    const query = bare.indexOf('?');
    if (query >= 0) bare = bare.slice(0, query);

    const slash = bare.indexOf('/');
    host = (slash >= 0 ? bare.slice(0, slash) : bare).toLowerCase();
    path = slash >= 0 ? bare.slice(slash).toLowerCase() : '';

    if (host.length === 0) {
      return { ok: false, error: 'An address cannot start with “/”.' };
    }
  }

  // A bare host is a host in the small web.
  if (!host.includes('.')) {
    host = `${host}${WEB_ROOT}`;
  }

  for (const label of host.split('.')) {
    if (!LABEL.test(label)) {
      return { ok: false, error: `“${label}” is not a valid part of an address.` };
    }
  }

  // A trailing slash is not a different address.
  if (path.length > 1) {
    path = path.replace(/\/+$/, '');
  }
  if (path === '/') {
    path = '';
  }

  const address = path.length > 0 ? `${host}${path}` : host;

  if (address.length > MAX_ADDRESS_LENGTH) {
    return { ok: false, error: 'That address is too long.' };
  }

  return { ok: true, address, inWeb: isInWeb(address) };
}

/**
 * Decide what kind of arrival an address produced.
 *
 * `siteExists` is the answer to "is there a site published at this address?" -
 * the caller has to look it up. Splitting this out keeps `normalizeAddress`
 * pure, and keeps the "no such address" outcome distinct from the "not part
 * of this web" one: the brief wants two different failures, not one.
 */
export function resolveKind(address: string, siteExists: boolean): AddressKind {
  if (!isInWeb(address)) return 'offweb';
  return siteExists ? 'page' : 'notfound';
}
