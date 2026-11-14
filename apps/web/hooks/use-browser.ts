'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';

import { normalizeAddress, resolveLink } from '@small-web-browser/shared';

import { ApiError, api } from '@/lib/api';
import { browserReducer, initialBrowserState } from '@/lib/browser-state';

const PERSON_KEY = 'wyxan.personId';

/**
 * The browser's behaviour, in one place.
 *
 * Every navigation goes through the server: the client normalises an address
 * for instant feedback, but the server is what records the arrival, decides
 * what kind of arrival it was, snapshots what was on screen, and moves the
 * history cursor. The client then takes the state the server sends back.
 */
export function useBrowser() {
  const [state, dispatch] = useReducer(browserReducer, initialBrowserState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const report = useCallback((error: unknown) => {
    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Something went wrong.';

    dispatch({ type: 'error', error: message });
  }, []);

  /** The person's id, from local storage, or the first person on the list. */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const people = await api.people();
        if (cancelled) return;

        dispatch({ type: 'people/loaded', people });

        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(PERSON_KEY) : null;
        const known = people.find((person) => person.id === stored);
        const personId = known?.id ?? people[0]?.id ?? null;

        if (personId) {
          dispatch({ type: 'person/changed', personId });
        }
      } catch (error) {
        if (!cancelled) report(error);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [report]);

  /** Load one person's history. */
  const refresh = useCallback(async (personId: string) => {
    try {
      const list = await api.history(personId);
      dispatch({ type: 'history/loaded', list });
    } catch (error) {
      report(error);
    }
  }, [report]);

  // Load the history whenever the person changes.
  useEffect(() => {
    if (!state.personId) return;
    void refresh(state.personId);
  }, [state.personId, refresh]);

  /** Switch to browsing as somebody else. */
  const choosePerson = useCallback((personId: string) => {
    window.localStorage.setItem(PERSON_KEY, personId);
    dispatch({ type: 'person/changed', personId });
  }, []);

  /**
   * Arrive somewhere.
   *
   * `via` is how the reader got here, and it is part of the permanent
   * record: the history list shows it beside every arrival.
   */
  const navigate = useCallback(
    async (rawAddress: string, via: string, referrerAddress?: string) => {
      const personId = stateRef.current.personId;
      if (!personId) return;

      dispatch({ type: 'busy', busy: true });

      try {
        const result = await api.visit({
          personId,
          address: rawAddress,
          via,
          ...(referrerAddress ? { referrerAddress } : {}),
        });

        dispatch({ type: 'visit/arrived', visit: result.visit, history: result.state });
        dispatch({ type: 'busy', busy: false });
        await refresh(personId);
      } catch (error) {
        report(error);
      }
    },
    [refresh, report],
  );

  /** Type an address into the address bar. */
  const goToAddress = useCallback(
    async (input: string) => {
      // Normalised here for instant feedback, and again on the server, which
      // is the one that decides.
      const normalised = normalizeAddress(input);

      if (!normalised.ok) {
        dispatch({ type: 'error', error: normalised.error });
        return;
      }

      await navigate(normalised.address, 'typed');
    },
    [navigate],
  );

  /** Follow a link from inside a published page. */
  const followLink = useCallback(
    async (href: string) => {
      const current = stateRef.current.current;
      if (!current) return;

      const resolved = resolveLink(href, current.address);
      if (!resolved.ok) {
        dispatch({ type: 'error', error: resolved.error });
        return;
      }

      await navigate(resolved.address, 'link', current.address);
    },
    [navigate],
  );

  /** Search, and record the results as an arrival. */
  const search = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length === 0) return;

      const personId = stateRef.current.personId;
      if (!personId) return;

      dispatch({ type: 'busy', busy: true });

      try {
        const response = await api.search(trimmed);
        dispatch({ type: 'search/results', response });

        // A search is an arrival, and it occupies a place in the history, so
        // that Back returns to the results.
        const result = await api.visit({
          personId,
          address: `search:${trimmed}`,
          via: 'search',
        });

        dispatch({ type: 'visit/arrived', visit: result.visit, history: result.state });
        dispatch({ type: 'busy', busy: false });
        await refresh(personId);
      } catch (error) {
        report(error);
      }
    },
    [refresh, report],
  );

  /** Go back one arrival. */
  const back = useCallback(async () => {
    const personId = stateRef.current.personId;
    if (!personId) return;

    dispatch({ type: 'busy', busy: true });

    try {
      const result = await api.back(personId);

      if (!result) {
        // Nowhere to go back to. The control is disabled anyway.
        dispatch({ type: 'busy', busy: false });
        return;
      }

      dispatch({ type: 'history/moved', visit: result.visit, history: result.state });
      dispatch({ type: 'busy', busy: false });
      await refresh(personId);
    } catch (error) {
      report(error);
    }
  }, [refresh, report]);

  /** Go forward one arrival. */
  const forward = useCallback(async () => {
    const personId = stateRef.current.personId;
    if (!personId) return;

    dispatch({ type: 'busy', busy: true });

    try {
      const result = await api.forward(personId);

      if (!result) {
        dispatch({ type: 'busy', busy: false });
        return;
      }

      dispatch({ type: 'history/moved', visit: result.visit, history: result.state });
      dispatch({ type: 'busy', busy: false });
      await refresh(personId);
    } catch (error) {
      report(error);
    }
  }, [refresh, report]);

  /** Jump to an entry in the history. */
  const jump = useCallback(
    async (index: number) => {
      const personId = stateRef.current.personId;
      if (!personId) return;

      dispatch({ type: 'busy', busy: true });

      try {
        const result = await api.jump(personId, index);

        dispatch({ type: 'history/moved', visit: result.visit, history: result.state });
        dispatch({ type: 'busy', busy: false });
        await refresh(personId);
      } catch (error) {
        report(error);
      }
    },
    [refresh, report],
  );

  /** Publish a page, and then arrive at it. */
  const publish = useCallback(
    async (input: { address: string; title: string; html: string }) => {
      const personId = stateRef.current.personId;
      if (!personId) throw new ApiError('Choose a name first.', 0, null);

      const site = await api.publish({ ...input, authorId: personId });

      await navigate(site.address, 'publish');

      return site;
    },
    [navigate],
  );

  const dismissError = useCallback(() => dispatch({ type: 'error', error: null }), []);

  return {
    state,
    actions: {
      goToAddress,
      followLink,
      search,
      back,
      forward,
      jump,
      publish,
      choosePerson,
      dismissError,
      refresh,
    },
  };
}
