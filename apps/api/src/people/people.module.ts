import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PeopleController } from './people.controller.js';
import { PeopleService } from './people.service.js';
import { Person, PersonSchema } from './schemas/person.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }])],
  controllers: [PeopleController],
  providers: [PeopleService],
  exports: [PeopleService, MongooseModule],
})
export class PeopleModule {}
