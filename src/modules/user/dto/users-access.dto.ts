import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";
import { PermissionEnum, RoleEnum } from "src/common/enum";
import { IUser } from "src/common/interface";

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