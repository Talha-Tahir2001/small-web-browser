import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { JumpDto, MoveDto, PersonQueryDto } from './dto/history.dto.js';
import { HistoryService, type HistoryListDto, type MoveResultDto } from './history.service.js';

@Controller('api/history')
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  /**
   * The history list: every arrival this person has made, with the current
   * one marked and the lost ones marked as lost.
   */
  @Get()
  read(@Query() query: PersonQueryDto): Promise<HistoryListDto> {
    return this.history.read(query.personId);
  }

  /**
   * Back one arrival.
   *
   * `204` when there is nowhere to go back to: the control is disabled in
   * the browser, and the server does not treat it as an error.
   */
  @Post('back')
  @HttpCode(HttpStatus.OK)
  async back(
    @Body() dto: MoveDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MoveResultDto | null> {
    const result = await this.history.back(dto.personId);
    if (!result) {
      res.status(HttpStatus.NO_CONTENT);
      return null;
    }
    return result;
  }

  /** Forward one arrival. `204` when there is nowhere to go forward to. */
  @Post('forward')
  @HttpCode(HttpStatus.OK)
  async forward(
    @Body() dto: MoveDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MoveResultDto | null> {
    const result = await this.history.forward(dto.personId);
    if (!result) {
      res.status(HttpStatus.NO_CONTENT);
      return null;
    }
    return result;
  }

  /**
   * Jump to an entry in the stack.
   *
   * Jumping discards the entries after it, so the forward entries are lost -
   * and the response says which ones were.
   */
  @Post('jump')
  @HttpCode(HttpStatus.OK)
  jump(@Body() dto: JumpDto): Promise<MoveResultDto> {
    return this.history.jump(dto.personId, dto.index);
  }
}
