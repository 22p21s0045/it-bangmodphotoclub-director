import { IsArray, IsDateString, IsInt, IsOptional, IsString, Min, IsEnum } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsDateString({}, { each: true })
  @IsOptional()
  eventDates?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  joinLimit?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  activityHours?: number;

  @IsDateString()
  @IsOptional()
  submissionDeadline?: string;

  @IsOptional()
  @IsEnum(['UPCOMING', 'PENDING_RAW', 'PENDING_EDIT', 'COMPLETED'])
  status?: 'UPCOMING' | 'PENDING_RAW' | 'PENDING_EDIT' | 'COMPLETED';
}
