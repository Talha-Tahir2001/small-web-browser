export type VisitKind = 'page' | 'notfound' | 'offweb' | 'search';
export type VisitVia = 'typed' | 'link' | 'search' | 'publish' | 'history';

export type HistoryEntry = {
    visitId: string;
    address: string;
    title: string;
    kind: VisitKind;
    via: VisitVia;
    visitedAt: string;
    pruned: boolean;
};

export type HistoryState = { entries: HistoryEntry[]; cursor: number };

/** What was on screen when the reader arrived. */
export type VisitSnapshotDto = {
    title: string;
    html: string | null;
    query: string | null;
    resultAddresses: string[];
    errorCode: string | null;
};

/** An arrival, as the browser is given it. */
export type VisitDto = {
    visitId: string;
    address: string;
    kind: VisitKind;
    title: string;
    via: VisitVia;
    referrerAddress: string | null;
    visitedAt: string;
    /** Absolute URL of the sandboxed document for this arrival. */
    renderUrl: string;
    snapshot: VisitSnapshotDto;
};

/** The history stack, as the browser is given it. */
export type HistoryStateDto = {
    personId: string;
    entries: HistoryEntry[];
    cursor: number;
    canGoBack: boolean;
    canGoForward: boolean;
};
