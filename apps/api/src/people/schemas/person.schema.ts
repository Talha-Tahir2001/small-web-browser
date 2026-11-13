import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * A person is a name from a list. The brief has no accounts, no passwords
 * and no sessions: choosing a name *is* the identity, and the history belongs
 * to whoever picked it.
 */
export type PersonDocument = HydratedDocument<Person>;

@Schema({ collection: 'people', versionKey: false })
export class Person {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string;
}

export const PersonSchema = SchemaFactory.createForClass(Person);
