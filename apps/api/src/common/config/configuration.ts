/**
 * Every environment variable the API reads, with its default.
 *
 * The defaults are the ones in SPEC 1.4 and they are chosen so that a fresh
 * clone runs with `docker compose up -d mongo` and nothing else.
 */
export interface Configuration {
  port: number;
  mongoUri: string;
  webOrigins: string[];
  maxHtmlBytes: number;
}

export const configuration = (): Configuration => ({
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/wyxan',
  webOrigins: (process.env.WEB_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  maxHtmlBytes: Number(process.env.MAX_HTML_BYTES ?? 65536),
});

export default configuration;
