import { IsMongoId } from "class-validator";
import { Types } from "mongoose";

export class TransformDTO {
    @IsMongoId()
    wareHouseTargetId! : Types.ObjectId
}