import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';

import { PublishSiteDto } from './dto/publish-site.dto.js';
import { SitesService, type PublishedSiteDto, type SiteDto } from './sites.service.js';

@Controller('api/sites')
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  /**
   * Publish a page.
   *
   * `201` with the page's details, `400` with the first rule that was not
   * met, or `409` with a suggestion if the address is taken.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  publish(@Body() dto: PublishSiteDto): Promise<PublishedSiteDto> {
    return this.sites.publish(dto);
  }

  /**
   * Read a page's details.
   *
   * The address may carry a path, so the route is a wildcard and the pieces
   * are joined back together.
   */
  @Get('*address')
  read(@Param('address') address: string | string[]): Promise<SiteDto> {
    const raw = Array.isArray(address) ? address.join('/') : address;
    return this.sites.read(raw);
  }
}
