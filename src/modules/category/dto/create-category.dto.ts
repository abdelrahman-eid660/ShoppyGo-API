import { IsArray, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCategoryDto{
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
