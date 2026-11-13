import { Controller, Get, Param, Res } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Response } from 'express';
import { Model } from 'mongoose';

import { notFound } from '../common/errors.js';
import { Visit, type VisitDocument } from '../visits/schemas/visit.schema.js';
import { RenderService } from './render.service.js';

/**
 * The sandboxed document.
 *
 * This is the origin the published pages are served from - 127.0.0.1:4000 -
 * which is deliberately *not* the app's origin (localhost:3000). The split
 * is the first layer of containment: even if every other layer were missing,
 * a published page still could not reach the app's cookies, storage or DOM.
 */
@Controller('render')
export class RenderController {
  constructor(
    @InjectModel(Visit.name) private readonly visits: Model<VisitDocument>,
    private readonly render: RenderService,
  ) {}

  /**
   * Serve the snapshot of an arrival, sandboxed.
   *
   * Never the live site: the content is what was on screen when the reader
   * arrived, which is what makes going back exact.
   */
  @Get(':visitId')
  async show(
    @Param('visitId') visitId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const visit = await this.visits.findById(visitId).lean().exec();

    if (!visit) {
      throw notFound('There is no such arrival.');
    }

    const html = this.render.build({
      kind: visit.kind,
      html: visit.snapshot.html,
      title: visit.snapshot.title,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Security-Policy', this.render.contentSecurityPolicy());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');

    return html;
  }
}
