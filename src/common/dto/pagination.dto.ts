import { ArgsType, Field, ID, Int, registerEnumType } from "@nestjs/graphql";
import {  Type } from "class-transformer";
import { IsEnum, IsInt, IsMongoId, IsOptional, IsString, Min } from "class-validator";
import { Types } from "mongoose";
import { SortEnum } from "../enum";

export class PaginationDTO {
@IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit? : number;

    @IsOptional()
    @IsEnum(SortEnum)
    sort?: SortEnum;

    @IsOptional()
    @IsString()
    search?: string;
}

registerEnumType(SortEnum , {name : "SortProduts"})

@ArgsType()
export class PaginationGQLDTO {
    @Field(()=> Int , {nullable : true})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number

    @Field(()=> Int , {nullable : true})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit? : number;

    @Field(()=> SortEnum , {nullable : true})
    @IsOptional()
    @IsEnum(SortEnum)
    sort?: SortEnum;

    @Field(()=> String , {nullable : true})
    @IsOptional()
    @IsString()
    search?: string;
}

@ArgsType()
export class GetProductDTO {
    @Field(()=> ID)
    @IsMongoId()
    productId! : Types.ObjectId
}