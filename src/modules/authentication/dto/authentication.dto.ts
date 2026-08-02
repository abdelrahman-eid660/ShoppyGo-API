import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IsMatch } from 'src/common/decorator';
import { AddressDTO } from 'src/common/dto';
import { GenderEnum, PermissionEnum, ProviderEnum } from 'src/common/enum';
import type { Address } from 'src/common/interface';

export class LoginDTO {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsStrongPassword()
  password!: string;

  @IsOptional()
  @IsString()
  FCM?: string;
}
export class SignupDTO extends LoginDTO {
  @MaxLength(55)
  @MinLength(2)
  @IsNotEmpty()
  firstName!: string;

  @MaxLength(55)
  @MinLength(2)
  @IsNotEmpty()
  lastName!: string;

  @ValidateIf((data: SignupDTO) => {
    return Boolean(data.password);
  })
  @IsMatch('password')
  confirmPassword!: string;

  @IsNotEmpty()
  @ValidateNested({each : true})
  @Type(()=> AddressDTO)
  address! : Address

  @IsOptional()
  @Matches(/^(02|2|\+20)?01[0-25]\d{8}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  DOB?: string;

  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @IsOptional()
  @IsArray()
  @IsEnum(PermissionEnum, { each: true })
  permissions?: PermissionEnum[];

  @IsOptional()
  @IsEnum(ProviderEnum)
  provider?: ProviderEnum;
}
export class ResendOTPDTO {
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
export class ConfirmOTPDTO extends ResendOTPDTO {
  @IsNotEmpty()
  @Length(6)
  otp!: string;
}
export class ForgetPasswordDTO {
  @IsEmail()
  email?: string;

  @Matches(/^(02|2|\+20)?01[0-25]\d{8}$/)
  phone?: string;
}
export class SignWhitGoogleDTO {
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
export class ResetPasswordDTO extends LoginDTO {}
