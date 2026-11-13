import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { normalizeAddress, push, resolveKind } from '@small-web-browser/shared';
import type { VisitDto, VisitKind, VisitSnapshotDto } from '@small-web-browser/shared';

import { badRequest } from '../common/errors.js';
import { notFoundPage, offWebPage } from '../common/pages.js';
import { BrowserStateStore } from '../history/browser-state.store.js';
import { toHistoryStateDto } from '../history/history-state.dto.js';
import { Site, type SiteDocument } from '../sites/schemas/site.schema.js';
import { RecordVisitDto } from './dto/record-visit.dto.js';
import { Visit, type VisitDocument } from './schemas/visit.schema.js';

export type RecordVisitResult = {
  visit: VisitDto;
  state: ReturnType<typeof toHistoryStateDto>;
};

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name) private readonly visits: Model<VisitDocument>,
    @InjectModel(Site.name) private readonly sites: Model<SiteDocument>,
    private readonly store: BrowserStateStore,
    private readonly config: ConfigService,
  ) {}

  /**
   * Record an arrival and put it on the stack.
   *
   * Every arrival is recorded, including the ones that find nothing: an
   * address that leads nowhere is still somewhere the reader went, and it
   * restores as "not found" rather than silently becoming a live page.
   */
  async arrive(dto: RecordVisitDto): Promise<RecordVisitResult> {
    if (!Types.ObjectId.isValid(dto.personId ?? '')) {
      throw badRequest('That is not one of the names on the list.');
    }
    const personId = new Types.ObjectId(dto.personId);

    // The client normalises the address too, for instant feedback, but the
    // server never trusts it.
    const normalised = normalizeAddress(dto.address ?? '');
    if (!normalised.ok) {
      throw badRequest('That is not an address this web can hold.');
    }
    const address = normalised.address;

    const site = normalised.inWeb
      ? await this.sites.findOne({ address }).lean().exec()
      : null;

    const kind = resolveKind(address, Boolean(site));
    const snapshot = this.snapshotFor(kind, address, site);

    const referrer = dto.referrerAddress ? normalizeAddress(dto.referrerAddress) : null;

    const visit = await this.visits.create({
      personId,
      address,
      kind,
      title: snapshot.title,
      via: dto.via,
      referrerAddress: referrer?.ok ? referrer.address : null,
      visitedAt: new Date(),
      snapshot,
      pruned: false,
    });

    // The arrival goes on top of the stack, and anything that was ahead of
    // the cursor falls off - that is what "forward is lost" means.
    const previous = await this.store.load(personId);
    const next = push(previous, {
      visitId: visit._id.toString(),
      address,
      title: snapshot.title,
      kind,
      via: dto.via,
      visitedAt: visit.visitedAt.toISOString(),
      pruned: false,
    });

    await this.store.markPruned(next.pruned.map((entry) => entry.visitId));
    await this.store.save(personId, next.state);

    return {
      visit: this.toVisitDto(visit),
      state: toHistoryStateDto(personId.toString(), next.state),
    };
  }

  /** The snapshot of an arrival: what was on screen. */
  private snapshotFor(
    kind: VisitKind,
    address: string,
    site: (SiteDocument & { _id: Types.ObjectId }) | null,
  ): VisitSnapshotDto {
    if (kind === 'page' && site) {
      return {
        title: site.title,
        html: site.html,
        query: null,
        resultAddresses: [],
        errorCode: null,
      };
    }

    if (kind === 'notfound') {
      return {
        title: `No such address: ${address}`,
        html: notFoundPage(address),
        query: null,
        resultAddresses: [],
        errorCode: 'notfound',
      };
    }

    return {
      title: 'That address is not part of this web',
      html: offWebPage(address),
      query: null,
      resultAddresses: [],
      errorCode: 'offweb',
    };
  }

  private toVisitDto(visit: VisitDocument): VisitDto {
    const port = this.config.get<number>('port') ?? 4000;

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
}
