import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';

/**
 * A site is one page of HTML, published at an address of its own.
 *
 * `html` is the author's markup, verbatim. `searchText` is derived from it
 * once, at publish time, and never recomputed on read - that keeps the set of
 * indexed terms stable and the query path a single indexed lookup.
 */
export type SiteDocument = HydratedDocument<Site>;

@Schema({ collection: 'sites', versionKey: false })
export class Site {
  /** Normalised address, e.g. `tidepool.zz`. The only thing a site is known by. */
  @Prop({ required: true, unique: true, trim: true })
  address: string;

  @Prop({ required: true, trim: true })
  title: string;

  /** The author's HTML, byte for byte. */
  @Prop({ required: true })
  html: string;

  /** Title + body text, normalised for the text index. */
  @Prop({ required: true })
  searchText: string;

  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'Person' })
  authorId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  publishedAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  /** 1 on create. Only ever incremented by a `replace`, which is a stretch goal. */
  @Prop({ required: true, default: 1 })
  version: number;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

// The one text index on the collection. Titles weigh ten times a body match,
// so a page whose *title* matches a query outranks one that merely mentions
// it in a paragraph.
SiteSchema.index(
  { title: 'text', searchText: 'text' },
  { weights: { title: 10, searchText: 1 }, name: 'site_text' },
);
