import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HistoryModule } from '../history/history.module.js';
import { Site, SiteSchema } from '../sites/schemas/site.schema.js';
import { RecordVisitDto } from './dto/record-visit.dto.js';
import { VisitsController } from './visits.controller.js';
import { VisitsService } from './visits.service.js';
import { Visit, VisitSchema } from './schemas/visit.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visit.name, schema: VisitSchema },
      { name: Site.name, schema: SiteSchema },
    ]),
    HistoryModule,
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService, MongooseModule],
})
export class VisitsModule {}
