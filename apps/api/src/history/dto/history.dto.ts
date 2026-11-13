import { IsInt, IsString, Min } from 'class-validator';

export class PersonQueryDto {
  @IsString()
  personId!: string;
}

export class MoveDto {
  @IsString()
  personId!: string;
}

export class JumpDto extends MoveDto {
  /** The position in the stack to jump to. */
  @IsInt()
  @Min(0)
  index!: number;
}
