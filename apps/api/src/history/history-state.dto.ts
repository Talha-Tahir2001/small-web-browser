import type { HistoryState, HistoryStateDto } from '@small-web-browser/shared';
import { canGoBack, canGoForward } from '@small-web-browser/shared';

/**
 * The history stack as the browser is given it.
 *
 * The server sends the whole state back after every change, so the client
 * never has to reconstruct it and the two can never disagree about where the
 * cursor is.
 */
export function toHistoryStateDto(personId: string, state: HistoryState): HistoryStateDto {
  return {
    personId,
    entries: state.entries,
    cursor: state.cursor,
    canGoBack: canGoBack(state),
    canGoForward: canGoForward(state),
  };
}
