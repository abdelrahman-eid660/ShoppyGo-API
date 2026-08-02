import { PaginationDTO } from 'src/common/dto';
import {
  IsOptional,
  IsEnum,
  IsMongoId,
  IsDateString,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import {
  FinancialCategoryEnum,
  FinancialSourceEnum,
  SortEnum,
} from 'src/common/enum';
import { Transform, Type } from 'class-transformer';
import { ArgsType, Field, ID, Int } from '@nestjs/graphql';
import { Types } from 'mongoose';

@ArgsType()
export class AllFinancialReviewDTO {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @Field(() => SortEnum, { nullable: true })
  @IsOptional()
  @IsEnum(SortEnum)
  sort?: SortEnum;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId()
  @Field(() => ID, { nullable: true })
  warehouseId?: string;

  @IsOptional()
  @IsEnum(FinancialCategoryEnum)
  @Field(() => FinancialCategoryEnum, { nullable: true })
  category?: FinancialCategoryEnum;

  @IsOptional()
  @Field(() => FinancialSourceEnum, { nullable: true })
  @IsEnum(FinancialSourceEnum)
  source?: FinancialSourceEnum;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  @Field(() => String, { nullable: true })
  startDate?: string;

  @IsOptional()
  @Type(() => Date)
  @Field(() => String, { nullable: true })
  @IsDateString()
  endDate?: string;
}
@ArgsType()
export class GetFinancialQGLDTO {
  @Field(() => ID)
  @IsMongoId()
  financialId!: Types.ObjectId;
}
export class GetFinancialDTO {
  @IsMongoId()
  financialId!: Types.ObjectId;
}
