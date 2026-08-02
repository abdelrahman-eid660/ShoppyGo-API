import { Type } from "class-transformer";
import { ArrayMinSize, ArrayNotEmpty, ArrayUnique, IsArray, IsBoolean, IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength, ValidateNested } from "class-validator";
import { AddressDTO } from "src/common/dto";
import type{  Address, ISupplier } from "src/common/interface";



export class CreateSupplierDto implements Partial<ISupplier> {
    @ValidateNested()
    @Type(()=> AddressDTO)
    address!: Address ;
    @IsString()
    @IsEmail()
    email!: string ;
    @IsBoolean()
    isActive!: boolean ;
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name!: string ;
    @IsArray()
    @IsString({each : true})
    @ArrayUnique()
    @ArrayNotEmpty()
    @ArrayMinSize(1)
    @IsNotEmpty({each : true})
    @Matches(/^(\+20|0)1[0125][0-9]{8}$/, {each: true,message: 'Invalid Egyptian phone number'})
    phone!: string[] ;
}
