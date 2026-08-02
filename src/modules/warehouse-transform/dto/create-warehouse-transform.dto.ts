import { Type } from "class-transformer";
import { ArrayNotEmpty, ArrayUnique, IsArray, IsDate, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsPositive, IsString, Min, ValidateNested } from "class-validator";
import { Types } from "mongoose";
import { IsFutureDate } from "src/common/decorator";
import {IWareHouseTransform, IWareHouseTransformItems } from "src/common/interface";

export class IWareHouseTransformItemsDto implements Partial<IWareHouseTransformItems> {
    @IsMongoId()
    productVariantId!: Types.ObjectId;
    @IsInt()
    @Min(1, { message: 'Quantity must be at least 1' })
    quantity!: number;
}

export class CreateWarehouseTransformDto implements Partial<IWareHouseTransform> {
    @IsMongoId()
    fromWarehouseId!: Types.ObjectId ;
    @IsMongoId()
    toWarehouseId!: Types.ObjectId ;
    @ValidateNested({each : true})
    @IsArray()
    @ArrayUnique()
    @Type(()=> IWareHouseTransformItemsDto)
    @ArrayNotEmpty()
    items!: IWareHouseTransformItems[] ;
    @IsString()
    @IsOptional()
    notes?: string ;
    @Type(()=> Date)
    @IsFutureDate()
    @IsDate()
    leaveAt!: Date;
}
