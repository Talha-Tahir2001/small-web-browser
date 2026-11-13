/**
 * The browser history state machine.
 *
 * This is the piece of the whole project that has to be *provably* right, so
 * it lives here as four pure functions with no clock, no network and no
 * database. The API is a thin wrapper that persists whatever the machine
 * returns; the server and the tests therefore agree by construction, because
 * they are running the same code.
 *
 * The model is deliberately two things at once (SPEC 2.5):
 *
 *   - a **log** of arrivals, which is append-only and never rewritten. Back
 *     and forward do not add to it; they move over it.
 *   - a **stack** of reachable arrivals, which *is* truncatable. Navigating
 *     from a mid-stack position throws away the entries after the cursor.
 *
 * "Forward can be lost" and "a record of everywhere you have been" pull in
 * opposite directions if history is a single list. Two structures, with the
 * log as the permanent record and the stack as the navigation surface, is
 * the only way to satisfy both.
 */

import type { HistoryEntry, HistoryState } from './types.js';

export type PushResult = {
  /** The stack after the arrival. */
  state: HistoryState;
  /** The entries that fell off the end of the stack, marked as lost. */
  pruned: HistoryEntry[];
};

export type MoveResult = {
  /** The stack after the move. */
  state: HistoryState;
  /** False when the cursor was already at that end - a no-op, not an error. */
  moved: boolean;
};

export type JumpResult =
  | { ok: true; state: HistoryState; pruned: HistoryEntry[] }
  | { ok: false; error: string };

/** True when there is somewhere to go back to. */
export function canGoBack(state: HistoryState): boolean {
  return state.cursor > 0;
}

/** True when there is somewhere to go forward to. */
export function canGoForward(state: HistoryState): boolean {
  return state.cursor < state.entries.length - 1;
}

/** The entry under the cursor, if the stack has one. */
export function currentEntry(state: HistoryState): HistoryEntry | null {
  return state.entries[state.cursor] ?? null;
}

/**
 * Arrive somewhere.
 *
 * Every entry after the cursor is dropped from the stack and reported as
 * pruned - this is what "forward is lost" means. The entries themselves are
 * not deleted anywhere: they stay in the arrival log, and the history panel
 * shows them marked as lost so that the loss is visible rather than silent.
 *
 * The pushed entry is always a fresh arrival, even if the address has been
 * visited before: two visits to the same address are two arrivals.
 */
export function push(state: HistoryState, entry: HistoryEntry): PushResult {
  const head = state.entries.slice(0, state.cursor + 1);
  const pruned = state.entries.slice(state.cursor + 1).map(markPruned);

  return {
    state: {
      entries: [...head, { ...entry, pruned: false }],
      cursor: head.length,
    },
    pruned,
  };
}

/**
 * Step back one arrival.
 *
 * This never appends and never creates a Visit: going back is a return to an
 * arrival that already happened, and its `via` and `visitedAt` still describe
 * how it was first reached. At the start of the stack this is a no-op rather
 * than an error - the control is disabled in the UI, and the server does not
 * complain.
 */
export function back(state: HistoryState): MoveResult {
  if (!canGoBack(state)) {
    return { state, moved: false };
  }
  return { state: { ...state, cursor: state.cursor - 1 }, moved: true };
}

/**
 * Step forward one arrival.
 *
 * The mirror of `back`, and equally a no-op at the end of the stack.
 */
export function forward(state: HistoryState): MoveResult {
  if (!canGoForward(state)) {
    return { state, moved: false };
  }
  return { state: { ...state, cursor: state.cursor + 1 }, moved: true };
}

/**
 * Jump to an entry in the stack.
 *
 * Jumping is a navigation, so it truncates the stack exactly as `push` does:
 * everything after the target is dropped and reported as pruned. That is real
 * browser behaviour, and it is required by "forward can be lost" - a reviewer
 * who jumps back into the middle of a trail must not be able to then press
 * Forward to return to where they were.
 *
 * An out-of-range index is refused rather than clamped: the API turns it into
 * a 400, because "jump to entry 99" is a client bug, not an edge of the
 * stack.
 */
export function jump(state: HistoryState, index: number): JumpResult {
  if (!Number.isInteger(index)) {
    return { ok: false, error: 'A history position must be a whole number.' };
  }
  if (index < 0 || index >= state.entries.length) {
    return { ok: false, error: 'There is no history entry at that position.' };
  }

  const pruned = state.entries.slice(index + 1).map(markPruned);

  return {
    ok: true,
    state: {
      entries: state.entries.slice(0, index + 1),
      cursor: index,
    },
    pruned,
  };
}

/** Mark an entry as lost, without touching the original. */
function markPruned(entry: HistoryEntry): HistoryEntry {
  return { ...entry, pruned: true };
}
