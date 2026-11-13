import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { PipelineStage } from 'mongoose';

import { buildSnippet, htmlToText } from '@small-web-browser/shared';

import { badRequest } from '../common/errors.js';
import { Site, type SiteDocument } from '../sites/schemas/site.schema.js';

export type SearchResultDto = {
  address: string;
  title: string;
  snippet: string;
  score: number;
};

export type SearchResponseDto = {
  query: string;
  total: number;
  results: SearchResultDto[];
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Search across every page in the web.
 *
 * The search reads the *body* of a page, not just its title: a query that
 * appears only in a paragraph still finds the page. Titles weigh ten times a
 * body match in the text index, and an exact title match is pushed to the
 * front outright.
 */
@Injectable()
export class SearchService {
  private ready: Promise<unknown> | null = null;

  constructor(@InjectModel(Site.name) private readonly sites: Model<SiteDocument>) {}

  async find(rawQuery: string, limit?: number, offset = 0): Promise<SearchResponseDto> {
    const query = rawQuery.trim();

    if (query.length === 0) {
      throw badRequest('What are you looking for?');
    }
    if (query.length > 200) {
      throw badRequest('That search is too long.');
    }

    const capped = Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    await this.ensureIndexed();

    const pipeline: PipelineStage[] = [
      { $match: { $text: { $search: query } } },
      { $addFields: { score: { $meta: 'textScore' } } },
      {
        $addFields: {
          titleExact: {
            $cond: [{ $eq: [{ $toLower: '$title' }, query.toLowerCase()] }, 1000, 0],
          },
        },
      },
      // The tie-break on address makes the order deterministic: two pages
      // with the same score always come back in the same order.
      { $sort: { titleExact: -1, score: -1, address: 1 } },
      { $skip: offset },
      { $limit: capped },
      { $project: { address: 1, title: 1, score: 1, html: 1, _id: 0 } },
    ];

    const counted: PipelineStage[] = [
      { $match: { $text: { $search: query } } },
      { $count: 'total' },
    ];

    const [documents, totals] = await Promise.all([
      this.sites.aggregate(pipeline).exec(),
      this.sites.aggregate(counted).exec(),
    ]);

    const total = totals.length > 0 ? (totals[0] as { total: number }).total : 0;

    return {
      query,
      total,
      results: documents.map((document) => {
        const site = document as {
          address: string;
          title: string;
          score: number;
          html: string;
        };

        return {
          address: site.address,
          title: site.title,
          // The snippet is drawn from the page's own text - the prose, with
          // the markup stripped - rather than from the folded text that gets
          // indexed. The indexed text has no punctuation, so it reads as a
          // bag of words; the snippet should read like the page does.
          snippet: buildSnippet(htmlToText(site.html ?? ''), query),
          score: site.score,
        };
      }),
    };
  }

  /**
   * Make sure the text index exists before the first search.
   *
   * MongoDB refuses a `$text` query until the index is there, and the index
   * is built in the background when the model is first used - so on a fresh
   * database the very first search could otherwise arrive a moment too
   * early.
   */
  private async ensureIndexed(): Promise<void> {
    this.ready ??= this.sites.init().catch(() => undefined);
    await this.ready;
  }
}
