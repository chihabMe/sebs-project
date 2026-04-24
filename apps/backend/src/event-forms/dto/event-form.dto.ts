import { IsString, IsArray, ValidateNested, IsBoolean, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EventFormQuestionDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  question: string;

  @ApiProperty()
  @IsBoolean()
  required: boolean;
}

export class UpdateEventFormDto {
  @ApiProperty({ type: [EventFormQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventFormQuestionDto)
  questions: EventFormQuestionDto[];
}
