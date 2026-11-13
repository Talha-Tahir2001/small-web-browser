import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { Person, PersonDocument } from './schemas/person.schema.js';

export type PersonDto = {
  id: string;
  name: string;
};

@Injectable()
export class PeopleService {
  constructor(
    @InjectModel(Person.name) private readonly people: Model<PersonDocument>,
  ) {}

  /** Everyone who can browse, in name order. */
  async list(): Promise<PersonDto[]> {
    const people = await this.people.find().sort({ name: 1 }).lean().exec();

    return people.map((person) => ({
      id: person._id.toString(),
      name: person.name,
    }));
  }

  /** True when the id names someone who exists. */
  async exists(id: string): Promise<boolean> {
    if (!id) return false;
    const count = await this.people.countDocuments({ _id: id }).exec();
    return count > 0;
  }
}
