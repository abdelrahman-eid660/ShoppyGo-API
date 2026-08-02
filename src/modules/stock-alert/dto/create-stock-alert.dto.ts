import { IsMongoId } from "class-validator";
import { Types } from "mongoose";

export class CreateStockAlertDto {
    @IsMongoId()
    productVariantId! : Types.ObjectId
}
