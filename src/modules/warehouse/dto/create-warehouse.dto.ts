import { Type } from "class-transformer";
import { ArrayMinSize, ArrayNotEmpty, ArrayUnique, IsArray, IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateNested } from "class-validator";
import { Types } from "mongoose";
import { AddressDTO } from "src/common/dto";
import type{ Address, IWareHouse } from "src/common/interface";

export class CreateWarehouseDto implements Partial<IWareHouse> {
    @ValidateNested()
    @Type(()=> AddressDTO)
    address!: Address ;
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    code?: string ;
    @IsString()
    @IsOptional()
    coverImage?: string ;
    @IsMongoId()
    manager!: Types.ObjectId ;
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    name!: string ;
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(50000)
    notes?: string ;
    @IsString({each : true})
    @IsArray()
    @ArrayUnique()
    @ArrayNotEmpty()
    @ArrayMinSize(1 , {message : "at least one number phone"})
    @Matches(/^(02|2|\+2|\+20)?01[0-25]\d{8}$/ , {each : true})
    phone!: string[] ;
    @IsBoolean()
    @IsOptional()
    isMain?: boolean
    @IsBoolean()
    @IsOptional()
    isActive?: boolean
}
