import type {
  HistoryListDto,
  HistoryStateDto,
  VisitDto,
} from '@small-web-browser/shared';

/**
 * The API client.
 *
 * The app origin is localhost:3000 and the API origin is 127.0.0.1:4000 -
 * different origins on purpose. Everything here is a plain `fetch` with
 * `Content-Type: application/json`; the API answers with JSON and the
 * standard Nest error shape, `{ statusCode, message, error }`.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:4000';

export type Person = {
  id: string;
  name: string;
};

export type SearchResult = {
  address: string;
  title: string;
  snippet: string;
  score: number;
};

export type SearchResponse = {
  query: string;
  total: number;
  results: SearchResult[];
};

export type PublishedSite = {
  address: string;
  title: string;
  version: number;
  publishedAt: string;
};

export type PublishInput = {
  address: string;
  title: string;
  html: string;
  authorId: string;
  replace?: boolean;
};

export type VisitResult = {
  visit: VisitDto;
  state: HistoryStateDto;
};

export type MoveResult = {
  visit: VisitDto;
  state: HistoryStateDto;
  pruned: unknown[];
};

/** An error the API reported, with the status it came back with. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  /** The address the API suggested, when the address was already taken. */
  get suggestion(): string | null {
    if (this.body && typeof this.body === 'object' && 'suggestion' in this.body) {
      const suggestion = (this.body as { suggestion?: unknown }).suggestion;
      return typeof suggestion === 'string' ? suggestion : null;
    }
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(
      'The browser cannot reach the web. Is the API running on port 4000?',
      0,
      null,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : `The request failed (${response.status}).`;

    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export const api = {
  base: API_BASE,

  people: () => request<Person[]>('/api/people'),

  history: (personId: string) =>
    request<HistoryListDto>(`/api/history?personId=${encodeURIComponent(personId)}`),

  visit: (input: { personId: string; address: string; via: string; referrerAddress?: string }) =>
    request<VisitResult>('/api/visits', { method: 'POST', body: JSON.stringify(input) }),

  back: (personId: string) =>
    request<MoveResult | undefined>('/api/history/back', {
      method: 'POST',
      body: JSON.stringify({ personId }),
    }),

  forward: (personId: string) =>
    request<MoveResult | undefined>('/api/history/forward', {
      method: 'POST',
      body: JSON.stringify({ personId }),
    }),

  jump: (personId: string, index: number) =>
    request<MoveResult>('/api/history/jump', {
      method: 'POST',
      body: JSON.stringify({ personId, index }),
    }),

  search: (query: string) =>
    request<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`),

  publish: (input: PublishInput) =>
    request<PublishedSite>('/api/sites', { method: 'POST', body: JSON.stringify(input) }),
};
