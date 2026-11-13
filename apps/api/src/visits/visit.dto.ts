import type { VisitDto, VisitSnapshotDto } from '@small-web-browser/shared';

/**
 * An arrival, as the browser is given it.
 *
 * The render URL points at the sandboxed document for this arrival - the
 * snapshot, never the live site.
 */
export function toVisitDto(
  visit: {
    _id: { toString(): string };
    address: string;
    kind: VisitDto['kind'];
    title: string;
    via: VisitDto['via'];
    referrerAddress: string | null;
    visitedAt: Date;
    snapshot: VisitSnapshotDto & { resultAddresses?: string[] };
  },
  port: number,
): VisitDto {
  return {
    visitId: visit._id.toString(),
    address: visit.address,
    kind: visit.kind,
    title: visit.title,
    via: visit.via,
    referrerAddress: visit.referrerAddress,
    visitedAt: visit.visitedAt.toISOString(),
    renderUrl: `http://127.0.0.1:${port}/render/${visit._id.toString()}`,
    snapshot: {
      title: visit.snapshot.title,
      html: visit.snapshot.html,
      query: visit.snapshot.query,
      resultAddresses: visit.snapshot.resultAddresses ?? [],
      errorCode: visit.snapshot.errorCode,
    },
  };
}
