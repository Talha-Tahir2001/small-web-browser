import type {
  HistoryListDto,
  HistoryStateDto,
  VisitDto,
} from '@small-web-browser/shared';

import type { Person, SearchResponse } from './api';

/**
 * What the browser shell knows.
 *
 * The server owns the history; the client keeps a copy so the toolbar can
 * disable Back and Forward without a round trip. Every response from the
 * server replaces the client's copy wholesale, so the two can never disagree
 * about where the cursor is.
 */
export type BrowserState = {
  people: Person[];
  personId: string | null;
  /** The arrival on screen. */
  current: VisitDto | null;
  /** The navigable stack. */
  history: HistoryStateDto | null;
  /** The permanent log, as the history panel shows it. */
  list: HistoryListDto | null;
  /** The results of the last search, when the current arrival is one. */
  search: SearchResponse | null;
  busy: boolean;
  error: string | null;
  notice: string | null;
};

export const initialBrowserState: BrowserState = {
  people: [],
  personId: null,
  current: null,
  history: null,
  list: null,
  search: null,
  busy: false,
  error: null,
  notice: null,
};

export type BrowserAction =
  | { type: 'people/loaded'; people: Person[] }
  | { type: 'person/changed'; personId: string }
  | { type: 'history/loaded'; list: HistoryListDto }
  | { type: 'visit/arrived'; visit: VisitDto; history: HistoryStateDto }
  | { type: 'history/moved'; visit: VisitDto; history: HistoryStateDto }
  | { type: 'search/results'; response: SearchResponse }
  | { type: 'search/cleared' }
  | { type: 'busy'; busy: boolean }
  | { type: 'error'; error: string | null }
  | { type: 'notice'; notice: string | null };

export function browserReducer(state: BrowserState, action: BrowserAction): BrowserState {
  switch (action.type) {
    case 'people/loaded':
      return { ...state, people: action.people };

    case 'person/changed':
      // Switching name switches whose history is shown. The page on screen
      // stays on screen.
      return {
        ...state,
        personId: action.personId,
        list: null,
        history: null,
        error: null,
      };

    case 'history/loaded':
      return { ...state, list: action.list };

    case 'visit/arrived':
      return {
        ...state,
        current: action.visit,
        history: action.history,
        search: action.visit.kind === 'search' ? state.search : null,
        error: null,
      };

    case 'history/moved':
      return {
        ...state,
        current: action.visit,
        history: action.history,
        search: action.visit.kind === 'search' ? state.search : null,
        error: null,
      };

    case 'search/results':
      return { ...state, search: action.response };

    case 'search/cleared':
      return { ...state, search: null };

    case 'busy':
      return { ...state, busy: action.busy };

    case 'error':
      return { ...state, error: action.error, busy: false };

    case 'notice':
      return { ...state, notice: action.notice };

    default:
      return state;
  }
}

/** The address shown in the address bar for whatever is on screen. */
export function addressOf(visit: VisitDto | null): string {
  if (!visit) return '';
  return visit.address;
}
