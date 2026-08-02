import { InputType, PartialType } from '@nestjs/graphql';
import {
  ArrayUnique,
    IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';
import {
  IProduct,
  IProductAttribute,
} from 'src/common/interface';

@InputType()
export class ProductDto implements Partial<IProduct> {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  title!: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(5000)
  description!: string;
  @IsPositive()
  @IsNumber()
  basePrice!: number;
  @IsMongoId()
  categoryId!: Types.ObjectId;
  @IsMongoId()
  brandId!: Types.ObjectId;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  attributes?: IProductAttribute[] | undefined;
  @IsOptional()
  @IsString({each : true})
  @IsArray()
  gallery?: string[] | undefined;
  @IsOptional()
  @IsString()
  image?: string | undefined;
}

