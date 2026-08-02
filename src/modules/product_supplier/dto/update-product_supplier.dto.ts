import { PartialType } from '@nestjs/mapped-types';
import { CreateProductSupplierDto } from './create-product_supplier.dto';
import { IsBoolean, IsEnum, IsInt, IsMongoId, IsOptional, IsPositive, IsString } from "class-validator";
import { Types } from "mongoose";
import { SharedCurrencyEnum } from "src/common/enum";
export class UpdateProductSupplierDto extends PartialType(CreateProductSupplierDto) {
    @IsOptional()
    @IsMongoId()
    productVariantId?: Types.ObjectId ;
    @IsMongoId()
    @IsOptional()
    supplierId?: Types.ObjectId;

    @IsInt()
    @IsPositive()
    @IsOptional()
    costPrice?: number;
    @IsPositive()
    @IsInt()
    @IsOptional()
    leadTimeDays?: number ;
    @IsPositive()
    @IsInt()
    @IsOptional()
    minOrderQuantity?: number ;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean ;
    @IsBoolean()
    @IsOptional()
    isPrimary?: boolean;

    @IsString()
    @IsOptional()
    @IsEnum(SharedCurrencyEnum)
    currency?: SharedCurrencyEnum;
}
