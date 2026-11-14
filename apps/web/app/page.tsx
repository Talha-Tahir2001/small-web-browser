'use client';

import { useState } from 'react';

import { IconHistory, IconPencil } from '@tabler/icons-react';

import { AddressBar, SearchBox } from '@/components/AddressBar';
import { PersonPicker } from '@/components/PersonPicker';
import { Viewport } from '@/components/Viewport';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBrowser } from '@/hooks/use-browser';

/**
 * The browser.
 *
 * A small web in a database, and a browser to read it in: an address bar,
 * links, back, forward, history, search, and a record of everywhere you have
 * been. It is a web page, not a desktop application - there is no page
 * reload between navigations, because the address bar is a control rather
 * than a location.
 */
export default function Page() {
  const { state, actions } = useBrowser();
  const [historyOpen, setHistoryOpen] = useState(true);

  const canGoBack = state.history?.canGoBack ?? false;
  const canGoForward = state.history?.canGoForward ?? false;

  return (
    <div className="flex h-svh flex-col bg-background text-foreground">
      <header className="flex flex-col gap-2 border-b p-2">
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => void actions.back()}
              disabled={!canGoBack || state.busy}
              aria-label="Back"
              title="Back"
            >
              <span aria-hidden="true">←</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void actions.forward()}
              disabled={!canGoForward || state.busy}
              aria-label="Forward"
              title="Forward"
            >
              <span aria-hidden="true">→</span>
            </Button>
          </div>

          <AddressBar
            value={state.current?.address ?? ''}
            error={state.error}
            busy={state.busy}
            onSubmit={(address) => void actions.goToAddress(address)}
          />

          <SearchBox busy={state.busy} onSubmit={(query) => void actions.search(query)} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen((open) => !open)}
            aria-pressed={historyOpen}
          >
            <IconHistory />
            History
          </Button>
          <Button variant="ghost" size="sm" disabled title="Coming with the publish panel">
            <IconPencil />
            Publish
          </Button>

          <div className="flex-1" />

          <PersonPicker
            people={state.people}
            personId={state.personId}
            onChange={actions.choosePerson}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col bg-muted/30">
          <Viewport
            current={state.current}
            search={state.search}
            onFollowLink={(href) => void actions.followLink(href)}
            onOpenResult={(address) => void actions.followLink(address)}
          />
        </main>

        {historyOpen ? <Separator orientation="vertical" className="h-auto" /> : null}
      </div>
    </div>
  );
}
