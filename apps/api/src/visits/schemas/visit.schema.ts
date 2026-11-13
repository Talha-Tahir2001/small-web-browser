import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';

import type { VisitKind, VisitVia } from '@small-web-browser/shared';

/**
 * What the reader actually saw when they arrived.
 *
 * This is the mechanism for restore-on-return. It is denormalised into the
 * visit on purpose: the alternative - re-fetching the site when the reader
 * goes back - cannot honour "a page gone back to is the page that was left".
 * Duplication is cheap at this scale.
 */
@Schema({ _id: false })
export class VisitSnapshot {
  @Prop({ required: true })
  title: string;

  /** The author's HTML, for an arrival that found a site. */
  @Prop({ type: String, default: null })
  html: string | null;

  /** The query, for a search arrival. */
  @Prop({ type: String, default: null })
  query: string | null;

  /** The addresses a search matched. Empty for every other kind of arrival. */
  @Prop({ type: [String], default: [] })
  resultAddresses: string[];

  /** `notfound` or `offweb`, for an arrival that found nothing. */
  @Prop({ type: String, default: null })
  errorCode: string | null;
}

export const VisitSnapshotSchema = SchemaFactory.createForClass(VisitSnapshot);

/**
 * An arrival: the permanent record that history is made of.
 *
 * Visits are append-only. Back and forward do not create one; they move over
 * them. The navigable stack is a separate thing (`BrowserState`), and it is
 * the one that gets truncated when forward is lost.
 */
export type VisitDocument = HydratedDocument<Visit>;

@Schema({ collection: 'visits', versionKey: false })
export class Visit {
  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'Person', index: true })
  personId: mongoose.Types.ObjectId;

  /** The normalised address that was requested. */
  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ required: true, type: String, enum: ['page', 'notfound', 'offweb', 'search'] })
  kind: VisitKind;

  /** The title of the page, or the title of the failure. */
  @Prop({ required: true })
  title: string;

  /** How the reader got here. Never changes after the arrival. */
  @Prop({ required: true, type: String, enum: ['typed', 'link', 'search', 'publish', 'history'] })
  via: VisitVia;

  @Prop({ type: String, default: null })
  referrerAddress: string | null;

  @Prop({ required: true })
  visitedAt: Date;

  @Prop({ required: true, type: VisitSnapshotSchema })
  snapshot: VisitSnapshot;

  /** True once the entry has fallen out of the navigable stack. */
  @Prop({ required: true, default: false })
  pruned: boolean;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

// The history list: one person's arrivals, newest last.
VisitSchema.index({ personId: 1, visitedAt: 1 });
// The lost-entries list: one person's arrivals that are no longer reachable.
VisitSchema.index({ personId: 1, pruned: 1 });
