import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { VisitKind } from '@small-web-browser/shared';

/**
 * The one script of ours that goes into an author's page.
 *
 * A sandboxed frame cannot navigate the top window, so a link inside a
 * published page would do nothing at all. This is the single injection the
 * project accepts: it intercepts clicks on links and tells the browser shell
 * which address was meant, instead of letting the frame navigate.
 *
 * It is a capture-phase listener on `document`, so the author's own scripts
 * run after it and cannot take it off. Even if they could, the worst case
 * would be a link that does nothing - never an escape.
 *
 * The href is posted as the author wrote it. The shell resolves it against
 * the address of the page it is on, because the frame cannot know that
 * address: its own location is the render URL.
 */
const LINK_BRIDGE = `<script id="wyxan-bridge">
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    e.preventDefault();
    parent.postMessage({ type: 'wyxan:navigate', href: href }, '*');
  }, true);
</script>`;

/**
 * Builds the document that is served inside the sandboxed frame.
 *
 * The document is always the *snapshot* of the arrival, never the live site.
 * That is what makes restore-on-return exact: the page in the frame and the
 * page in the history can never disagree.
 */
@Injectable()
export class RenderService {
  constructor(private readonly config: ConfigService) {}

  /** The document for an arrival. */
  build(snapshot: { kind: VisitKind; html: string | null; title: string }): string {
    const body = snapshot.html ?? '';

    // Our own pages are already complete documents.
    if (snapshot.kind !== 'page') {
      return body;
    }

    return this.withBridge(body);
  }

  /**
   * The Content-Security-Policy for the sandboxed document.
   *
   * `sandbox allow-scripts` applies the sandbox to the document even when
   * the URL is opened directly in a tab - so the containment does not depend
   * on the browser choosing to put it in a frame. `default-src 'none'` means
   * nothing may be fetched: no remote images, no fonts, no scripts, no
   * beacons, no exfiltration. `base-uri 'none'` means a `<base>` tag in the
   * author's HTML cannot hijack how links are resolved. `form-action
   * 'none'` means a form cannot be submitted anywhere.
   *
   * `script-src 'unsafe-inline'` is what lets the page's own JavaScript run
   * at all - a page with no scripts is not a web, and the brief expects
   * scripts to run. It costs nothing here, because the document has an
   * opaque origin and no network: a script in this frame can mess with this
   * frame and nothing else. It cannot reach the app, submit a form, open a
   * popup, or navigate the top window.
   *
   * Note that `script-src` names no hosts, so a *remote* script still cannot
   * be loaded - only scripts written into the page itself.
   */
  contentSecurityPolicy(): string {
    const origins = this.config.get<string[]>('webOrigins') ?? [];

    return [
      'sandbox allow-scripts',
      "default-src 'none'",
      "script-src 'unsafe-inline'",
      "style-src 'unsafe-inline'",
      'img-src data: blob:',
      'font-src data:',
      "base-uri 'none'",
      "form-action 'none'",
      `frame-ancestors ${origins.join(' ')}`,
    ].join('; ');
  }

  /** Put the link bridge in, immediately before the closing body tag. */
  private withBridge(html: string): string {
    const index = html.toLowerCase().lastIndexOf('</body>');

    if (index === -1) {
      return `${html}${LINK_BRIDGE}`;
    }

    return `${html.slice(0, index)}${LINK_BRIDGE}${html.slice(index)}`;
  }
}
