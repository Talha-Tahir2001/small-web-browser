import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BrowserState, BrowserStateSchema } from './schemas/browser-state.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BrowserState.name, schema: BrowserStateSchema }]),
  ],
  exports: [MongooseModule],
})
export class HistoryModule {}
