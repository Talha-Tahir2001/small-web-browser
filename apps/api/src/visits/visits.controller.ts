import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { RecordVisitDto } from './dto/record-visit.dto.js';
import { VisitsService, type RecordVisitResult } from './visits.service.js';

@Controller('api/visits')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  /**
   * Record an arrival.
   *
   * `201` with the arrival and the new history state. The state comes back
   * whole after every change, so the client never has to guess where the
   * cursor is.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  record(@Body() dto: RecordVisitDto): Promise<RecordVisitResult> {
    return this.visits.arrive(dto);
  }
}
