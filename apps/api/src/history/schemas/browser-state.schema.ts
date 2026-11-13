import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';

/**
 * The navigable stack: one person's history, as the browser can move through
 * it.
 *
 * `entries` holds the ids of the visits that are still reachable by Back and
 * Forward. `cursor` is the position within them. Entries that have fallen
 * out are removed from `entries` and marked `pruned` on the visit itself, so
 * the loss is visible in the history list without erasing the record.
 *
 * The stack is per *person*, not per session or per tab: "history belongs to
 * the name".
 */
export type BrowserStateDocument = HydratedDocument<BrowserState>;

@Schema({ collection: 'browserStates', versionKey: false })
export class BrowserState {
  @Prop({ required: true, unique: true, type: mongoose.Types.ObjectId, ref: 'Person' })
  personId: mongoose.Types.ObjectId;

  /** Ordered visit ids - the navigation surface. */
  @Prop({ type: [mongoose.Types.ObjectId], default: [] })
  entries: mongoose.Types.ObjectId[];

  /** Index into `entries`. The entry under it is the current page. */
  @Prop({ required: true, default: 0 })
  cursor: number;

  @Prop({ required: true })
  updatedAt: Date;
}

export const BrowserStateSchema = SchemaFactory.createForClass(BrowserState);
