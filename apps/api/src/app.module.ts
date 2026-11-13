import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { configuration } from './common/config/configuration.js';
import { HealthModule } from './health/health.module.js';
import { PeopleModule } from './people/people.module.js';
import { SearchModule } from './search/search.module.js';
import { SitesModule } from './sites/sites.module.js';
import { VisitsModule } from './visits/visits.module.js';
import { HistoryModule } from './history/history.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongoUri') as string,
      }),
    }),
    HealthModule,
    PeopleModule,
    SearchModule,
    SitesModule,
    VisitsModule,
    HistoryModule,
  ],
})
export class AppModule {}
