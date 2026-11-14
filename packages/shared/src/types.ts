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

/** One row of the history list: an arrival, and where it sits in the stack. */
export type HistoryListEntryDto = HistoryEntry & {
    /** Where it sits in the stack, or null when it has fallen off it. */
    stackIndex: number | null;
};

/**
 * The history list: the permanent record, not the stack.
 *
 * Every arrival the person has ever made, in order. The ones that have
 * fallen off the stack are still here, marked as lost - "forward can be
 * lost" has to be visible rather than silent.
 */
export type HistoryListDto = {
    personId: string;
    cursor: number;
    canGoBack: boolean;
    canGoForward: boolean;
    entries: HistoryListEntryDto[];
    totalVisits: number;
    lostCount: number;
};
