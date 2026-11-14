'use client';

import { useEffect, useRef } from 'react';

import type { VisitDto } from '@small-web-browser/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLinkBridge } from '@/hooks/use-link-bridge';
import type { SearchResponse } from '@/lib/api';

/**
 * The viewport: what the reader is looking at.
 *
 * A published page is shown in a sandboxed frame, served from the API's
 * origin rather than the app's. The frame is keyed by the visit id, so
 * arriving at the same address twice shows the frame the second time round
 * rather than a cached one - and going back to an earlier arrival of that
 * address shows the page as it was then.
 *
 * A search is shown natively, not in a frame: the results are part of the
 * browser, not a page published by a stranger.
 */
export function Viewport({
  current,
  search,
  onFollowLink,
  onOpenResult,
  onNeedSearch,
}: {
  current: VisitDto | null;
  search: SearchResponse | null;
  onFollowLink: (href: string) => void;
  onOpenResult: (address: string) => void;
  onNeedSearch: (query: string) => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useLinkBridge(frameRef, onFollowLink);

  // Going back to a search arrival has to show the results again: the
  // results are not part of the arrival, so they are fetched when the reader
  // comes back to it.
  const searchQuery = current?.kind === 'search' ? (current.snapshot.query ?? '') : '';
  const haveResults = search !== null && search.query === searchQuery;

  useEffect(() => {
    if (!searchQuery || haveResults) return;
    onNeedSearch(searchQuery);
  }, [searchQuery, haveResults, onNeedSearch]);

  if (!current) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-sm border-dashed shadow-none">
          <CardHeader>
            <h2 className="text-sm leading-none font-medium">Nothing open</h2>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Type an address above to start reading, or search for something that is written in a
            page.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (current.kind === 'search') {
    return (
      <SearchResults
        search={search}
        query={current.snapshot.query ?? ''}
        onOpen={onOpenResult}
      />
    );
  }

  return (
    <iframe
      key={current.visitId}
      ref={frameRef}
      src={current.renderUrl}
      sandbox="allow-scripts"
      title={current.title}
      className="h-full w-full border-0 bg-white"
    />
  );
}

/**
 * The results of a search: what was written in the pages, not just their
 * titles, with a passage from the matching text.
 */
function SearchResults({
  search,
  query,
  onOpen,
}: {
  search: SearchResponse | null;
  query: string;
  onOpen: (address: string) => void;
}) {
  if (!search) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Searching for <span className="font-medium text-foreground">{query}</span>…
      </div>
    );
  }

  if (search.results.length === 0) {
    return (
      <Card className="m-6 max-w-lg border-dashed shadow-none">
        <CardHeader>
          <h2 className="text-sm leading-none font-medium">Nothing found</h2>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No page in this web contains “{search.query}”. The search reads what is written in the
          pages, not just their titles.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {search.total} {search.total === 1 ? 'page' : 'pages'} mentioning “{search.query}”
      </h2>

      <ul className="mt-4 space-y-3">
        {search.results.map((result) => (
          <li key={result.address}>
            <Card className="shadow-none transition-colors hover:border-primary/40">
              <CardHeader>
                {/* A real heading: the results are a list of pages, and a
                    reader should be able to navigate them by heading. */}
                <h3 className="text-sm leading-none font-medium">{result.title}</h3>
                <Badge variant="secondary" className="font-mono">
                  {result.address}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => onOpen(result.address)}
                  className="text-left hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {result.snippet}
                </button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
