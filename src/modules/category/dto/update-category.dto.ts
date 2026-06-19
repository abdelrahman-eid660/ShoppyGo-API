import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Types } from "mongoose";
import { ICategory } from "src/common/interface";

export class UpdateCategoryDto{
    @MaxLength(50)
    @MinLength(2)
    @IsNotEmpty()
    @IsString()
    name!: string;
    @IsOptional()
    @IsString()
    image?: string | undefined;
    @IsOptional()
    @IsMongoId()
    parentId?: string | undefined;
}
