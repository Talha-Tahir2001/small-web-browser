'use client';

import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { ApiError } from '@/lib/api';

/**
 * Publish a page.
 *
 * An address and a page of HTML, written by the reader. The preview is a
 * sandboxed frame built from a `srcdoc` blob, so it has an opaque origin
 * and can fetch nothing - the same containment the published page gets.
 */
export function PublishPanel({
  open,
  onOpenChange,
  onPublish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (input: { address: string; title: string; html: string }) => Promise<unknown>;
}) {
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('<h1>My page</h1>\n<p>Written by me.</p>');
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setSuggestion(null);
    setBusy(true);

    try {
      await onPublish({ address, title, html });
      onOpenChange(false);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setSuggestion(caught.suggestion);
      } else {
        setError(caught instanceof Error ? caught.message : 'That did not work.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Publish a page</DialogTitle>
          <DialogDescription>
            Anyone can publish. The address is the only thing that identifies it, and the page is
            served back to you inside a sandbox.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="publish-address">Address</Label>
            <Input
              id="publish-address"
              value={address}
              spellCheck={false}
              autoComplete="off"
              placeholder="my-first-page.zz"
              onChange={(event) => setAddress(event.target.value)}
              className="font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="publish-title">Title</Label>
            <Input
              id="publish-title"
              value={title}
              placeholder="My first page"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="publish-html">HTML</Label>
            <Textarea
              id="publish-html"
              value={html}
              spellCheck={false}
              rows={12}
              onChange={(event) => setHtml(event.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="publish-preview">Preview</Label>
            <iframe
              id="publish-preview"
              title="Preview of the page you are publishing"
              sandbox="allow-scripts"
              srcDoc={html}
              className="h-64 w-full border bg-white"
            />
            <p className="text-xs text-muted-foreground">
              The preview is sandboxed exactly as the published page will be.
            </p>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>That did not publish</AlertTitle>
            <AlertDescription>
              {error}
              {suggestion ? (
                <>
                  {' '}
                  Try{' '}
                  <button
                    type="button"
                    className="font-mono underline underline-offset-2"
                    onClick={() => setAddress(suggestion)}
                  >
                    {suggestion}
                  </button>
                  .
                </>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
