import {
  ArrayUnique,
    IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
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

export class ProductDto implements Partial<IProduct> {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  title!: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  description!: string;
  @IsPositive()
  @IsInt()
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
