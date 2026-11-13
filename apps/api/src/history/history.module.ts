import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BrowserStateStore } from './browser-state.store.js';
import { BrowserState, BrowserStateSchema } from './schemas/browser-state.schema.js';
import { Visit, VisitSchema } from '../visits/schemas/visit.schema.js';

/**
 * The navigable stack.
 *
 * The store is exported so that arriving somewhere can push onto the stack
 * as well as reading it and moving around in it.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BrowserState.name, schema: BrowserStateSchema },
      { name: Visit.name, schema: VisitSchema },
    ]),
  ],
  providers: [BrowserStateStore],
  exports: [BrowserStateStore, MongooseModule],
})
export class HistoryModule {}
