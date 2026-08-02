import { Transform } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator"
import { TransformToObjectId } from "src/common/utils/ObjectId";

export class BrandDto {
    @IsString()
    logo! : string;
    @IsNotEmpty()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    name! : string
}

export class BrandIdDTO{
    @IsMongoId()
    @Transform(({value})=> TransformToObjectId(value))
    brandId! : string
}