'use client';

import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * The address bar.
 *
 * An address is the only thing typed here, and it is the only thing a site
 * author can point at. What is typed is normalised before it is sent - but
 * the server normalises it again, and the server is the one that decides.
 */
export function AddressBar({
  value,
  error,
  busy,
  onSubmit,
}: {
  value: string;
  error: string | null;
  busy: boolean;
  onSubmit: (address: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  // Follow the browser when it navigates, but never while the reader is
  // halfway through typing an address of their own.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <form
      className="flex flex-1 items-start gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Label htmlFor="address" className="sr-only">
          Address
        </Label>
        <Input
          id="address"
          name="address"
          value={draft}
          spellCheck={false}
          autoComplete="off"
          placeholder="tidepool.zz"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'address-error' : undefined}
          onChange={(event) => setDraft(event.target.value)}
          className="font-mono"
        />
        {error ? (
          <Alert id="address-error" variant="destructive" className="py-1">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <Button type="submit" disabled={busy} className="mt-0">
        Go
      </Button>
    </form>
  );
}

/**
 * The search box.
 *
 * Deliberately separate from the address bar: an address is an address, and
 * a search is a question about what is written in the pages. Two clear
 * inputs are easier to defend than one that guesses.
 */
export function SearchBox({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (query: string) => void;
}) {
  const [draft, setDraft] = useState('');

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
        setDraft('');
      }}
    >
      <Label htmlFor="search" className="sr-only">
        Search
      </Label>
      <Input
        id="search"
        name="search"
        value={draft}
        placeholder="Search the web"
        autoComplete="off"
        onChange={(event) => setDraft(event.target.value)}
        className="w-44"
      />
      <Button type="submit" variant="secondary" disabled={busy}>
        Search
      </Button>
    </form>
  );
}
