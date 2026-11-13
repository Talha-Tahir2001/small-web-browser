import { Controller, Get } from '@nestjs/common';

import { PeopleService, type PersonDto } from './people.service.js';

@Controller('api/people')
export class PeopleController {
  constructor(private readonly people: PeopleService) {}

  /** The list of names a reader can browse as. */
  @Get()
  list(): Promise<PersonDto[]> {
    return this.people.list();
  }
}
