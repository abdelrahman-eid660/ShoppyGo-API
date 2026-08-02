import { ArgsType, Field, ID, InputType, Int } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { ArrayNotEmpty, ArrayUnique, IsArray, IsInt, IsMongoId, IsNotEmpty, IsPositive, ValidateNested } from "class-validator";
import { Types } from "mongoose";

@InputType()
export class ReceivedItemsDTO {
    @IsInt()
    @IsNotEmpty()
    @IsPositive()
    @Field(()=> Int)
    receivedQuantity! : number
    @IsMongoId()
    @Field(()=> ID)
    productVariantId! : Types.ObjectId
}
@InputType()
export class ReceivedDTO {
    @ArrayUnique()
    @ArrayNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReceivedItemsDTO)
    @Field(()=>[ReceivedItemsDTO])
    items! : ReceivedItemsDTO[]
}