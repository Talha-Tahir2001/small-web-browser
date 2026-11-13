/**
 * The two pages the browser itself writes.
 *
 * Both are stored as a visit's snapshot, so that arriving at an address that
 * does not exist is still an arrival: it goes in the history, it can be
 * gone back to, and it restores as "not found" rather than silently becoming
 * a live page.
 *
 * They are deliberately self-contained. A published page is served under
 * `default-src 'none'`, and these are served the same way, so they may not
 * fetch a stylesheet, a font or an image - everything is inline.
 */

/** Escape text for interpolation into HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PAGE_STYLE = `
  :root { color-scheme: light dark; }
  body {
    font-family: ui-serif, Georgia, "Times New Roman", serif;
    line-height: 1.6;
    margin: 0 auto;
    max-width: 34rem;
    padding: 3rem 1.5rem;
  }
  h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; }
  p { margin: 0.75rem 0; }
  code {
    font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
    font-size: 0.9em;
  }
  .note { opacity: 0.7; font-size: 0.9em; }
`;

/** The page shown when an address is well-formed but has no site behind it. */
export function notFoundPage(address: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>No such address</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
<h1>No such address</h1>
<p>There is no page at <code>${escapeHtml(address)}</code>.</p>
<p class="note">It may never have existed, or it may have been taken down. Either way, this
arrival is recorded: you can come back to it, and you can go back to it.</p>
</body>
</html>`;
}

/** The page shown when an address is outside this web entirely. */
export function offWebPage(address: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Not part of this web</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
<h1>That address is not part of this web</h1>
<p><code>${escapeHtml(address)}</code> is outside the small web, which is made of addresses
ending in <code>.zz</code>.</p>
<p class="note">This is not the same as an address that does not exist. That one is
missing; this one is somewhere else entirely.</p>
</body>
</html>`;
}
