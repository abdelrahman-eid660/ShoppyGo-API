import { IsBoolean, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";
import { Types } from "mongoose";
import { SharedCurrencyEnum } from "src/common/enum";
import { IProductSupplier } from "src/common/interface";

export class CreateProductSupplierDto implements Partial<IProductSupplier> {
    @IsMongoId()
    @IsNotEmpty()
    productVariantId!: Types.ObjectId ;
    @IsMongoId()
    supplierId!: Types.ObjectId;

    @IsNumber()
    @IsPositive()
    costPrice!: number;
    @IsPositive()
    @IsInt()
    leadTimeDays!: number ;
    @IsPositive()
    @IsInt()
    minOrderQuantity!: number ;

    @IsBoolean()
    isActive!: boolean ;
    @IsBoolean()
    isPrimary!: boolean;

    @IsString()
    @IsEnum(SharedCurrencyEnum)
    currency!: SharedCurrencyEnum;

}
