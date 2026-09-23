import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateNested } from "class-validator";
import { AddressDTO } from "src/common/dto";
import { GenderEnum, PermissionEnum, RoleEnum } from "src/common/enum";
import type{ Address, IUser } from "src/common/interface";

export class UsersAccessDTO implements Partial<IUser>{
    @IsString()
    @IsNotEmpty()
    @IsEnum(RoleEnum)
    role!: RoleEnum;
    @IsArray()
    @ArrayNotEmpty()
    @IsEnum(PermissionEnum , {each : true})
    permissions!: PermissionEnum[];
}

export class updateUserDTO implements Partial<IUser>{
    @IsOptional()
    @IsDate()
    DOB?: Date;
    @IsOptional()
    @Type(()=> AddressDTO)
    @ValidateNested({each : true})
    address?: Address;
    @IsOptional()
    @IsString()
    @MaxLength(55)
    @MinLength(2)
    firstName?: string ;
    @IsOptional()
    @IsEnum(GenderEnum)
    gender?: GenderEnum ;
    @IsOptional()
    @IsString()
    @MaxLength(55)
    @MinLength(2)
    lastName?: string ;
    @IsOptional()
    @IsString()
    @Matches(/^((?:\+20|0020|20|0)?1[0125]\d{8}|(?:\+966|00966|966|0)?5\d{8}|(?:\+974|00974|974)?[3567]\d{7})$/)
    phone?: string ;
}