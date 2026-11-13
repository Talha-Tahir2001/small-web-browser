import { Controller, Get, Query } from '@nestjs/common';

import { SearchQueryDto } from './dto/search-query.dto.js';
import { SearchService, type SearchResponseDto } from './search.service.js';

@Controller('api/search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  /**
   * Find pages by what is written in them.
   *
   * This does not record an arrival: the results are not a page until the
   * reader chooses one, and the arrival happens when they do.
   */
  @Get()
  find(@Query() query: SearchQueryDto): Promise<SearchResponseDto> {
    return this.search.find(query.q, query.limit, query.offset);
  }
}
