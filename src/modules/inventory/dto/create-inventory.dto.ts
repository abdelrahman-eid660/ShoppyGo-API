import { IsInt, IsMongoId, IsPositive, Min } from "class-validator";
import { Types } from "mongoose";
import { IsGte } from "src/common/decorator";
import { IInventory } from "src/common/interface";

export class CreateInventoryDto implements Partial<IInventory> {
    @IsMongoId()
    productVariantId!: Types.ObjectId;
    @IsMongoId()
    wareHouseId!: Types.ObjectId;
    @IsInt()
    @Min(0)
    @IsPositive()
    @IsGte(['lowStockThreshold'])
    quantity!: number;
    @IsInt()
    @IsPositive()
    @Min(0)
    lowStockThreshold!: number;
}
