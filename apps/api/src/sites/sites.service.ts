import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import mongoose from 'mongoose';

import { deriveSearchText, normalizeAddress } from '@small-web-browser/shared';

import { badRequest, conflict, notFound } from '../common/errors.js';
import { Person, PersonDocument } from '../people/schemas/person.schema.js';
import { PublishSiteDto } from './dto/publish-site.dto.js';
import { validatePublish } from './publish-validation.js';
import { Site, SiteDocument } from './schemas/site.schema.js';

export type PublishedSiteDto = {
  address: string;
  title: string;
  version: number;
  publishedAt: string;
};

export type SiteDto = {
  address: string;
  title: string;
  author: string;
  publishedAt: string;
  version: number;
};

const MAX_TITLE_LENGTH = 200;

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name) private readonly sites: Model<SiteDocument>,
    @InjectModel(Person.name) private readonly people: Model<PersonDocument>,
    private readonly config: ConfigService,
  ) {}

  /**
   * Publish a page, or replace the one already at that address.
   *
   * The rules are checked in the order SPEC 5.4 gives, and the first one that
   * is not met is the one reported - so a person who typed a bad address and
   * forgot a title is told about the address, because that is the thing they
   * would have to change first.
   */
  async publish(dto: PublishSiteDto): Promise<PublishedSiteDto> {
    // 1-3. The address, the title and the HTML. These are checked without
    // touching the database, in the order SPEC 5.4 gives.
    const validated = validatePublish(dto, this.config.get<number>('maxHtmlBytes') ?? 65536);
    if (!validated.ok) {
      throw badRequest(validated.error);
    }
    const { address, title, html, searchText } = validated;

    // 4. The author.
    if (!mongoose.Types.ObjectId.isValid(dto.authorId ?? '')) {
      throw badRequest('That is not one of the names on the list.');
    }
    const author = await this.people.findById(dto.authorId).lean().exec();
    if (!author) {
      throw badRequest('That is not one of the names on the list.');
    }

    // 5. The address itself.
    const existing = await this.sites.findOne({ address }).lean().exec();
    const now = new Date();

    if (existing && !dto.replace) {
      throw conflict(`There is already a page at ${address}.`, {
        suggestion: await this.suggestAddress(address),
      });
    }

    if (existing) {
      // A replace bumps the version. The old page does not disappear: it
      // survives inside the snapshots of the visits that already saw it,
      // which is what makes "the page that was left" mean something.
      const updated = await this.sites
        .findOneAndUpdate(
          { address },
          {
            $set: { title, html, searchText, updatedAt: now, authorId: author._id },
            $inc: { version: 1 },
          },
          { new: true },
        )
        .lean()
        .exec();

      return this.toPublished(updated as SiteDocument);
    }

    const created = await this.sites.create({
      address,
      title,
      html,
      searchText,
      authorId: author._id,
      publishedAt: now,
      updatedAt: now,
      version: 1,
    });

    return this.toPublished(created);
  }

  /** The details of the page at an address. */
  async read(rawAddress: string): Promise<SiteDto> {
    const normalised = normalizeAddress(rawAddress ?? '');
    if (!normalised.ok) {
      throw notFound(`There is no page at ${rawAddress}.`);
    }

    const site = await this.sites
      .findOne({ address: normalised.address })
      .populate<{ authorId: { name: string } }>('authorId', 'name')
      .lean()
      .exec();

    if (!site) {
      throw notFound(`There is no page at ${normalised.address}.`);
    }

    const author =
      site.authorId && typeof site.authorId === 'object' && 'name' in site.authorId
        ? site.authorId.name
        : 'someone';

    return {
      address: site.address,
      title: site.title,
      author,
      publishedAt: site.publishedAt.toISOString(),
      version: site.version,
    };
  }

  /** The nearest free address, offered when the one asked for is taken. */
  private async suggestAddress(address: string): Promise<string> {
    const slash = address.indexOf('/');
    const host = slash >= 0 ? address.slice(0, slash) : address;
    const path = slash >= 0 ? address.slice(slash) : '';
    const stem = host.endsWith('.zz') ? host.slice(0, -'.zz'.length) : host;

    for (let n = 2; n < 100; n++) {
      const candidate = `${stem}-${n}.zz${path}`;
      const taken = await this.sites.exists({ address: candidate }).exec();
      if (!taken) return candidate;
    }

    return `${stem}-${Date.now()}.zz${path}`;
  }

  private toPublished(site: SiteDocument): PublishedSiteDto {
    return {
      address: site.address,
      title: site.title,
      version: site.version,
      publishedAt: site.publishedAt.toISOString(),
    };
  }
}
