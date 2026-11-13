import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // The API origin is 127.0.0.1:4000 and the app origin is localhost:3000.
  // They are different origins on purpose: it is the first containment layer
  // (SPEC 1.1). Only the origins we were told about may call the API.
  app.enableCors({
    origin: config.get<string[]>('webOrigins') ?? [],
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false }),
  );

  const port = config.get<number>('port') ?? 4000;
  await app.listen(port);

  console.log(`wyxan api listening on http://127.0.0.1:${port}`);
}

await bootstrap();
