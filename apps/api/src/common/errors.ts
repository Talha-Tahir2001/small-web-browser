import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * The error shape the whole API uses: `{ statusCode, message, error }`.
 *
 * The message is written for the person reading it, not for a log file: most
 * of these end up on screen in the address bar.
 */
export function badRequest(message: string): HttpException {
  return new HttpException(
    { statusCode: HttpStatus.BAD_REQUEST, message, error: 'Bad Request' },
    HttpStatus.BAD_REQUEST,
  );
}

export function notFound(message: string): HttpException {
  return new HttpException(
    { statusCode: HttpStatus.NOT_FOUND, message, error: 'Not Found' },
    HttpStatus.NOT_FOUND,
  );
}

export function conflict(message: string, extra: Record<string, unknown> = {}): HttpException {
  return new HttpException(
    { statusCode: HttpStatus.CONFLICT, message, error: 'Conflict', ...extra },
    HttpStatus.CONFLICT,
  );
}
