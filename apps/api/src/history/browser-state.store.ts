import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import type { HistoryEntry, HistoryState } from '@small-web-browser/shared';

import { Visit, type VisitDocument } from '../visits/schemas/visit.schema.js';
import { BrowserState, type BrowserStateDocument } from './schemas/browser-state.schema.js';

/**
 * The navigable stack, stored.
 *
 * The stack holds visit ids; the history list needs titles, kinds and how
 * each arrival happened, so loading it means reading the visits it points
 * at. That is a little work per request, and it is the right trade at this
 * scale: the stack is small, and the server is the only thing that knows
 * what the history means.
 */
@Injectable()
export class BrowserStateStore {
  constructor(
    @InjectModel(BrowserState.name) private readonly states: Model<BrowserStateDocument>,
    @InjectModel(Visit.name) private readonly visits: Model<VisitDocument>,
  ) {}

  /** The person's stack, as the state machine's shape. */
  async load(personId: Types.ObjectId): Promise<HistoryState> {
    const state = await this.states.findOne({ personId }).lean().exec();
    if (!state || state.entries.length === 0) {
      return { entries: [], cursor: 0 };
    }

    const visits = await this.visits
      .find({ _id: { $in: state.entries } })
      .lean()
      .exec();

    const byId = new Map(visits.map((visit) => [visit._id.toString(), visit]));

    const entries: HistoryEntry[] = state.entries
      .map((id) => byId.get(id.toString()))
      .filter((visit): visit is VisitDocument => Boolean(visit))
      .map((visit) => ({
        visitId: visit._id.toString(),
        address: visit.address,
        title: visit.title,
        kind: visit.kind,
        via: visit.via,
        visitedAt: visit.visitedAt.toISOString(),
        pruned: visit.pruned,
      }));

    return {
      entries,
      // A cursor pointing past the end would be a corrupt state; clamp it
      // rather than fail the request.
      cursor: Math.min(Math.max(state.cursor, 0), Math.max(0, entries.length - 1)),
    };
  }

  /** Write the stack back. */
  async save(personId: Types.ObjectId, state: HistoryState): Promise<void> {
    await this.states
      .findOneAndUpdate(
        { personId },
        {
          $set: {
            entries: state.entries.map((entry) => new Types.ObjectId(entry.visitId)),
            cursor: state.cursor,
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
  }

  /**
   * Mark visits as lost.
   *
   * The visits themselves are never deleted - they are the permanent record.
   * They are only marked, so the history panel can show them as lost
   * instead of pretending they never happened.
   */
  async markPruned(visitIds: string[]): Promise<void> {
    if (visitIds.length === 0) return;

    await this.visits
      .updateMany(
        { _id: { $in: visitIds.map((id) => new Types.ObjectId(id)) } },
        { $set: { pruned: true } },
      )
      .exec();
  }
}
