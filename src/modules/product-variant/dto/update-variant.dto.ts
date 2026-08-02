import { IsMongoId } from "class-validator";
import { Types } from "mongoose";

export class ProductVariantIdDTO{
    @IsMongoId()
    productVariantId! : Types.ObjectId
}