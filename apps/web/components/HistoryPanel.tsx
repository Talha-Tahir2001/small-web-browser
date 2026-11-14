'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import type { HistoryListDto } from '@small-web-browser/shared';

/**
 * The history panel.
 *
 * Every arrival this person has made, in order, with the current one marked
 * and the lost ones marked as lost. The lost ones are not hidden: "forward
 * can be lost" is only convincing if you can see it happen.
 */
export function HistoryPanel({
  list,
  onJump,
  onOpenAddress,
}: {
  list: HistoryListDto | null;
  onJump: (index: number) => void;
  onOpenAddress: (address: string) => void;
}) {
  if (!list) {
    return (
      <div className="p-4 text-xs text-muted-foreground">Loading history…</div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <h2 className="text-xs font-medium tracking-wide uppercase">History</h2>
        <span className="text-xs text-muted-foreground">
          {list.totalVisits} {list.totalVisits === 1 ? 'arrival' : 'arrivals'}
          {list.lostCount > 0 ? ` · ${list.lostCount} lost` : ''}
        </span>
      </div>

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <ol className="p-2">
          {list.entries.map((entry) => {
            const current = entry.stackIndex !== null && entry.stackIndex === list.cursor;
            const lost = entry.pruned;

            return (
              <li key={entry.visitId}>
                <Button
                  variant="ghost"
                  className={`h-auto w-full justify-start gap-2 px-2 py-1.5 text-left ${
                    lost ? 'text-muted-foreground line-through' : ''
                  }`}
                  aria-current={current ? 'true' : undefined}
                  onClick={() => {
                    // An arrival that is still on the stack is jumped to. One
                    // that has fallen off is visited again, which is what a
                    // real browser does with an old history entry.
                    if (entry.stackIndex !== null) {
                      onJump(entry.stackIndex);
                    } else {
                      onOpenAddress(entry.address);
                    }
                  }}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-xs font-medium">{entry.title}</span>
                    <span className="truncate font-mono text-[11px] text-muted-foreground">
                      {entry.address}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {entry.via}
                    </Badge>
                    {lost ? (
                      <Badge variant="secondary" className="text-[10px]">
                        lost
                      </Badge>
                    ) : null}
                  </span>
                </Button>
              </li>
            );
          })}
        </ol>
      </ScrollArea>
    </div>
  );
}
