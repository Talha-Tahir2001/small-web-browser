import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Visit, VisitSchema } from '../visits/schemas/visit.schema.js';
import { RenderController } from './render.controller.js';
import { RenderService } from './render.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Visit.name, schema: VisitSchema }])],
  controllers: [RenderController],
  providers: [RenderService],
})
export class RenderModule {}
