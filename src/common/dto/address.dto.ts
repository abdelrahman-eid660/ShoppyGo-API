import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class AddressDTO{
    @IsString()
    @IsNotEmpty()
    country!: string;
    @IsString()
    @IsNotEmpty()
    governorate!: string;
    @IsString()
    @IsNotEmpty()
    zone!: string;
    @IsString()
    @IsNotEmpty()
    street!: string;
    @IsInt()
    @IsNotEmpty()
    postalCode!: number;
}