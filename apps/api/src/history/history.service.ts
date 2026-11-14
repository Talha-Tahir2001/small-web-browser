import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { back, canGoBack, canGoForward, forward, jump } from '@small-web-browser/shared';
import type {
  HistoryEntry,
  HistoryListDto,
  HistoryListEntryDto,
  HistoryState,
  VisitDto,
} from '@small-web-browser/shared';

import { badRequest } from '../common/errors.js';
import { toVisitDto } from '../visits/visit.dto.js';
import { Visit, type VisitDocument } from '../visits/schemas/visit.schema.js';
import { BrowserStateStore } from './browser-state.store.js';
import { toHistoryStateDto } from './history-state.dto.js';


export type MoveResultDto = {
  visit: VisitDto;
  state: ReturnType<typeof toHistoryStateDto>;
  /** The entries that fell off the stack, when a move discarded any. */
  pruned: HistoryEntry[];
};

@Injectable()
export class HistoryService {
  constructor(
    private readonly store: BrowserStateStore,
    @InjectModel(Visit.name) private readonly visits: Model<VisitDocument>,
    private readonly config: ConfigService,
  ) {}

  /**
   * The history list: every arrival this person has ever made, in order.
   *
   * This is the permanent record, not the stack. Arrivals that have fallen
   * out of the stack are still here, marked as lost, because "forward can be
   * lost" has to be visible rather than silent.
   */
  async read(rawPersonId: string): Promise<HistoryListDto> {
    const personId = this.toPersonId(rawPersonId);
    const state = await this.store.load(personId);
    const visits = await this.visits.find({ personId }).sort({ visitedAt: 1 }).lean().exec();

    const stackIndexById = new Map(
      state.entries.map((entry, index) => [entry.visitId, index] as const),
    );

    const entries: HistoryListEntryDto[] = visits.map((visit) => {
      const visitId = visit._id.toString();
      return {
        visitId,
        address: visit.address,
        title: visit.title,
        kind: visit.kind,
        via: visit.via,
        visitedAt: visit.visitedAt.toISOString(),
        pruned: visit.pruned,
        stackIndex: stackIndexById.get(visitId) ?? null,
      };
    });

    return {
      personId: personId.toString(),
      cursor: state.cursor,
      canGoBack: canGoBack(state),
      canGoForward: canGoForward(state),
      entries,
      totalVisits: entries.length,
      lostCount: entries.filter((entry) => entry.pruned).length,
    };
  }

  /** Back one arrival. Null when there is nowhere to go back to. */
  async back(rawPersonId: string): Promise<MoveResultDto | null> {
    const personId = this.toPersonId(rawPersonId);
    const state = await this.store.load(personId);
    const result = back(state);

    if (!result.moved) {
      return null;
    }

    await this.store.save(personId, result.state);
    return this.toResult(personId, result.state, []);
  }

  /** Forward one arrival. Null when there is nowhere to go forward to. */
  async forward(rawPersonId: string): Promise<MoveResultDto | null> {
    const personId = this.toPersonId(rawPersonId);
    const state = await this.store.load(personId);
    const result = forward(state);

    if (!result.moved) {
      return null;
    }

    await this.store.save(personId, result.state);
    return this.toResult(personId, result.state, []);
  }

  /**
   * Jump to an entry in the stack.
   *
   * Jumping is a navigation, so it truncates the stack exactly as arriving
   * somewhere new does: everything after the target is lost, and reported.
   */
  async jump(rawPersonId: string, index: number): Promise<MoveResultDto> {
    const personId = this.toPersonId(rawPersonId);
    const state = await this.store.load(personId);
    const result = jump(state, index);

    if (!result.ok) {
      throw badRequest(result.error);
    }

    await this.store.markPruned(result.pruned.map((entry) => entry.visitId));
    await this.store.save(personId, result.state);

    return this.toResult(personId, result.state, result.pruned);
  }

  private async toResult(
    personId: Types.ObjectId,
    state: HistoryState,
    pruned: HistoryEntry[],
  ): Promise<MoveResultDto> {
    const current = state.entries[state.cursor];

    if (!current) {
      throw badRequest('There is nothing to show.');
    }

    const visit = await this.visits.findById(current.visitId).lean().exec();
    if (!visit) {
      throw badRequest('There is nothing to show.');
    }

    return {
      visit: toVisitDto(visit, this.config.get<number>('port') ?? 4000),
      state: toHistoryStateDto(personId.toString(), state),
      pruned,
    };
  }

  private toPersonId(rawPersonId: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(rawPersonId ?? '')) {
      throw badRequest('That is not one of the names on the list.');
    }
    return new Types.ObjectId(rawPersonId);
  }
}
