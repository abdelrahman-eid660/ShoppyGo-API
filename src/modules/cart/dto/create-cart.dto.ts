import { IsInt, IsMongoId, IsPositive } from "class-validator";
import { Types } from "mongoose";
import { ICartItem } from "src/common/interface";


export class CreateCartDto implements Partial<ICartItem> {
    @IsInt()
    quantity!: number;
    @IsMongoId()
    variantId!: Types.ObjectId;
}
