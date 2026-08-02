import { IsInt, IsNotEmpty, IsPositive, IsStrongPassword, Matches } from "class-validator"
import { IsMatch } from "src/common/decorator"

export class UpdatePasswordDTO {
    @IsNotEmpty()
    @IsStrongPassword()
    oldPassword! : string
    @IsNotEmpty()
    @IsStrongPassword()
    newPassword! : string
    @IsNotEmpty()
    @IsStrongPassword()
    @IsMatch('newPassword')
    confirmPassword! : string
}
export class LogoutDTO {
    @IsInt()
    @IsPositive()
    flag! : number
}