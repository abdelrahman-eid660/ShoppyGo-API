import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator"

export class BrandDto {
    @IsString()
    logo! : string;
    @IsNotEmpty()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    name! : string
}
