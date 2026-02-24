import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const TITLE_MAX_LENGTH = 100;
const MIN_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();
const MAX_IMAGE_COUNT = 20;

export class CreateWorkDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_YEAR)
  @Max(CURRENT_YEAR)
  year!: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  thumbnailUrl?: string | null;

  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      : value,
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IMAGE_COUNT)
  @IsString({ each: true })
  @IsUrl({ require_protocol: true, protocols: ['https'] }, { each: true })
  imageUrls!: string[];
}
