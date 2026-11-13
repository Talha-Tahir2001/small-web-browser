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