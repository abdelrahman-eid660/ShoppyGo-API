import { InputType, Int, Field, ID } from '@nestjs/graphql';
import { ArrayUnique, IsArray, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Types } from 'mongoose';
import { IProductAttribute, IProductVariant } from 'src/common/interface';
import { ProductVariantAttribute } from 'src/modules/product-variant/entities/product-variant.entity';

@InputType()
export class CreateProductVariantDTO implements Partial<IProductVariant> {
  @Field(() => String, { nullable : true })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(15)
  sku?: string | undefined;
  @Field(() => String, { nullable : true })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(5000)
  description?: string | undefined;
  @Field(() => [ProductVariantAttribute])
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  attributes?: IProductAttribute[];
  @Field(() => [], { nullable : true })
  @IsArray()
  @IsString({each : true})
  @IsOptional()
  images?: string[] | undefined;
  @Field(() => Int, { nullable : true })
  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  price?: number | undefined;
  @Field(() => ID)
  @IsNotEmpty()
  @IsMongoId()
  productId!: Types.ObjectId;
}

@InputType()
export class UpdateProductVariantDTO implements Partial<CreateProductVariantDTO> {
  @Field(() => String, { nullable : true })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  sku?: string;
  @Field(() => String, { nullable : true })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;
  @Field(() => [ProductVariantAttribute])
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  attributes?: IProductAttribute[];
  @Field(() => [], { nullable : true })
  @IsArray()
  @IsString({each : true})
  @IsOptional()
  images?: string[];
  @Field(() => Int, { nullable : true })
  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  price?: number;
}
