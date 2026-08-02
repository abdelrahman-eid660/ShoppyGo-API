import { PartialType } from '@nestjs/mapped-types';
import { CreateReviewDto } from './create-review.dto';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IsBadWord } from 'src/common/decorator';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {
  @MinLength(2)
  @MaxLength(500)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsBadWord()
  comment?: string;
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}
export class RejectReviewDTO {
  @IsString()
  @IsNotEmpty()
  reason! : string
}