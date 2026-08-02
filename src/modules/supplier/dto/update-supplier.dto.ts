import { PartialType } from '@nestjs/mapped-types';
import {  CreateSupplierDto } from './create-supplier.dto';
import { ArrayMinSize, ArrayNotEmpty, ArrayUnique, IsArray, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type{ Address } from 'src/common/interface';
import { AddressDTO } from 'src/common/dto';

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
        @ValidateNested()
        @IsOptional()
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
