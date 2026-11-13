import { describe, expect, it } from 'vitest';

import {
  back,
  canGoBack,
  canGoForward,
  currentEntry,
  forward,
  jump,
  push,
} from './history.js';
import type { HistoryEntry, HistoryState } from './types.js';

function entry(visitId: string, overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    visitId,
    address: `${visitId}.zz`,
    title: visitId,
    kind: 'page',
    via: 'typed',
    visitedAt: '2026-01-01T00:00:00.000Z',
    pruned: false,
    ...overrides,
  };
}

/** A stack of three arrivals with the cursor at the end. */
function stackOfThree(): HistoryState {
  return { entries: [entry('a'), entry('b'), entry('c')], cursor: 2 };
}

describe('push', () => {
  it('appends when the cursor is at the end', () => {
    const result = push(stackOfThree(), entry('d'));

    expect(result.state.entries.map((e) => e.visitId)).toEqual(['a', 'b', 'c', 'd']);
    expect(result.state.cursor).toBe(3);
    expect(result.pruned).toEqual([]);
  });

  it('truncates the forward entries when the cursor is mid-stack', () => {
    const result = push({ ...stackOfThree(), cursor: 0 }, entry('d'));

    expect(result.state.entries.map((e) => e.visitId)).toEqual(['a', 'd']);
    expect(result.state.cursor).toBe(1);
  });

  it('reports the entries it dropped, marked as lost', () => {
    const result = push({ ...stackOfThree(), cursor: 0 }, entry('d'));

    expect(result.pruned.map((e) => e.visitId)).toEqual(['b', 'c']);
    expect(result.pruned.every((e) => e.pruned)).toBe(true);
  });

  it('loses exactly the forward entries, which is Back -> Back -> navigate', () => {
    let state = stackOfThree();

    state = back(state).state;
    state = back(state).state;
    expect(state.cursor).toBe(0);

    const result = push(state, entry('d'));

    expect(result.pruned.map((e) => e.visitId)).toEqual(['b', 'c']);
    expect(canGoForward(result.state)).toBe(false);
  });

  it('does not touch the entries it keeps', () => {
    const result = push({ ...stackOfThree(), cursor: 0 }, entry('d'));

    expect(result.state.entries[0]?.visitId).toBe('a');
    expect(result.state.entries[0]?.pruned).toBe(false);
  });

  it('adds a new arrival to an empty stack', () => {
    const result = push({ entries: [], cursor: 0 }, entry('a'));

    expect(result.state.entries).toHaveLength(1);
    expect(result.state.cursor).toBe(0);
  });

  it('allows the same address twice, as two arrivals', () => {
    const first = push({ entries: [], cursor: 0 }, entry('a-1', { address: 'tidepool.zz' }));
    const second = push(first.state, entry('a-2', { address: 'tidepool.zz', via: 'link' }));

    expect(second.state.entries).toHaveLength(2);
    expect(second.state.entries[0]?.visitId).not.toBe(second.state.entries[1]?.visitId);
    expect(second.state.entries.every((e) => e.address === 'tidepool.zz')).toBe(true);
  });

  it('keeps the arrival it pushed un-pruned', () => {
    const result = push(stackOfThree(), entry('d', { pruned: true }));

    expect(result.state.entries.at(-1)?.pruned).toBe(false);
  });

  it('does not mutate the state it was given', () => {
    const before = stackOfThree();
    const snapshot = JSON.stringify(before);

    push(before, entry('d'));
    back(before);

    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe('back', () => {
  it('moves the cursor back one', () => {
    const result = back(stackOfThree());

    expect(result.moved).toBe(true);
    expect(result.state.cursor).toBe(1);
  });

  it('never appends an entry', () => {
    const before = stackOfThree();
    const result = back(before);

    expect(result.state.entries).toHaveLength(before.entries.length);
  });

  it('never changes an entry', () => {
    const before = stackOfThree();
    const result = back(before);

    expect(result.state.entries[1]).toEqual(before.entries[1]);
  });

  it('is a no-op at the start of the stack', () => {
    const state = { ...stackOfThree(), cursor: 0 };
    const result = back(state);

    expect(result.moved).toBe(false);
    expect(result.state.cursor).toBe(0);
  });

  it('is a no-op on an empty stack', () => {
    const result = back({ entries: [], cursor: 0 });

    expect(result.moved).toBe(false);
  });
});

describe('forward', () => {
  it('moves the cursor forward one', () => {
    const result = forward({ ...stackOfThree(), cursor: 0 });

    expect(result.moved).toBe(true);
    expect(result.state.cursor).toBe(1);
  });

  it('never appends an entry', () => {
    const before = stackOfThree();
    const result = forward({ ...before, cursor: 0 });

    expect(result.state.entries).toHaveLength(before.entries.length);
  });

  it('is a no-op at the end of the stack', () => {
    const result = forward(stackOfThree());

    expect(result.moved).toBe(false);
    expect(result.state.cursor).toBe(2);
  });

  it('is a no-op on an empty stack', () => {
    const result = forward({ entries: [], cursor: 0 });

    expect(result.moved).toBe(false);
  });
});

describe('back and forward together', () => {
  it('returns to the same entry it left', () => {
    const state = stackOfThree();

    const there = back(state).state;
    const andBack = forward(there);

    expect(andBack.moved).toBe(true);
    expect(andBack.state.cursor).toBe(2);
    expect(currentEntry(andBack.state)?.visitId).toBe('c');
  });

  it('walks back four and forward three over a long trail', () => {
    let state: HistoryState = { entries: [], cursor: 0 };
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      state = push(state, entry(id)).state;
    }

    for (let i = 0; i < 4; i++) state = back(state).state;
    expect(state.cursor).toBe(0);

    for (let i = 0; i < 3; i++) state = forward(state).state;
    expect(state.cursor).toBe(3);
    expect(currentEntry(state)?.visitId).toBe('d');
  });
});

describe('jump', () => {
  it('moves the cursor to the target', () => {
    const result = jump(stackOfThree(), 0);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.cursor).toBe(0);
  });

  it('truncates the forward entries', () => {
    const result = jump(stackOfThree(), 0);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.entries.map((e) => e.visitId)).toEqual(['a']);
    expect(canGoForward(result.state)).toBe(false);
  });

  it('reports the entries it dropped, marked as lost', () => {
    const result = jump(stackOfThree(), 1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pruned.map((e) => e.visitId)).toEqual(['c']);
    expect(result.pruned.every((e) => e.pruned)).toBe(true);
  });

  it('truncates even when jumping to the current entry', () => {
    const result = jump(stackOfThree(), 2);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pruned).toEqual([]);
  });

  it('refuses an index past the end', () => {
    const result = jump(stackOfThree(), 3);

    expect(result.ok).toBe(false);
  });

  it('refuses a negative index', () => {
    const result = jump(stackOfThree(), -1);

    expect(result.ok).toBe(false);
  });

  it('refuses an index that is not a whole number', () => {
    const result = jump(stackOfThree(), 1.5);

    expect(result.ok).toBe(false);
  });

  it('leaves the state alone when it refuses', () => {
    const before = stackOfThree();
    const result = jump(before, 99);

    expect(result.ok).toBe(false);
    expect(before.cursor).toBe(2);
  });
});

describe('canGoBack and canGoForward', () => {
  it('agree with the cursor', () => {
    const state = stackOfThree();

    expect(canGoBack(state)).toBe(true);
    expect(canGoForward(state)).toBe(false);
  });

  it('are both false on an empty stack', () => {
    const state = { entries: [], cursor: 0 };

    expect(canGoBack(state)).toBe(false);
    expect(canGoForward(state)).toBe(false);
  });
});

describe('currentEntry', () => {
  it('is the entry under the cursor', () => {
    expect(currentEntry(stackOfThree())?.visitId).toBe('c');
  });

  it('is null on an empty stack', () => {
    expect(currentEntry({ entries: [], cursor: 0 })).toBeNull();
  });
});
