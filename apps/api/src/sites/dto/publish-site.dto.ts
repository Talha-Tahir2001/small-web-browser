import { IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * The body of a publish request.
 *
 * The shape is checked here; the *rules* are checked in the service, in the
 * order SPEC 5.4 sets out. The order matters because the order in which the
 * rules are checked is the order in which a person is told what is wrong.
 */
export class PublishSiteDto {
  /** The address to publish at. Normalised by the server, never trusted raw. */
  @IsString()
  address!: string;

  @IsString()
  title!: string;

  /** The author's HTML, stored verbatim. */
  @IsString()
  html!: string;

  /** The person publishing, by id. */
  @IsString()
  authorId!: string;

  /** Replace the page at this address if one is already there. */
  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}
