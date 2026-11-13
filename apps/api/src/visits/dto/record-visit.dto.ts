import { IsIn, IsOptional, IsString } from 'class-validator';

import type { VisitVia } from '@small-web-browser/shared';

/**
 * The body of a "the reader arrived somewhere" request.
 *
 * The client normalises the address before sending it, for instant feedback,
 * but the server never trusts that: it re-normalises and re-validates
 * everything it is given.
 */
export class RecordVisitDto {
  /** The person who arrived. */
  @IsString()
  personId!: string;

  /** The address that was asked for. */
  @IsString()
  address!: string;

  /** How they got here. */
  @IsString()
  @IsIn(['typed', 'link', 'search', 'publish', 'history'])
  via!: VisitVia;

  /** The address they came from, if they followed a link. */
  @IsOptional()
  @IsString()
  referrerAddress?: string;
}
