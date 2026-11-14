'use client';

import { useEffect, type RefObject } from 'react';

/**
 * The other half of the link bridge.
 *
 * A page published in this web is served inside a sandboxed frame, and a
 * sandboxed frame cannot navigate the window that contains it. Without
 * something to carry the click out, a link inside a published page would do
 * nothing at all.
 *
 * The render endpoint injects one small script into the author's page: it
 * intercepts clicks on links and posts the href to this window. This hook
 * is the other end of that.
 *
 * Two things are checked before anything happens:
 *
 *   - the message must have come from the frame we are currently showing.
 *     The frame has an *opaque* origin, because it is sandboxed without
 *     `allow-same-origin`, so its origin cannot be checked - and the
 *     origin is meaningless anyway. The source can be, and that is the
 *     control that matters.
 *   - the message must be the one we expect: a `wyxan:navigate` with a
 *     string href.
 *
 * The href is then resolved against the address of the page on screen and
 * normalised by the shared library, which refuses anything outside the web
 * and anything with a scheme that is not http or https.
 */
export function useLinkBridge(
  frame: RefObject<HTMLIFrameElement | null>,
  onNavigate: (href: string) => void,
): void {
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow) return;

      const data = event.data as { type?: unknown; href?: unknown } | null;
      if (!data || data.type !== 'wyxan:navigate' || typeof data.href !== 'string') return;

      onNavigate(data.href);
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [frame, onNavigate]);
}
