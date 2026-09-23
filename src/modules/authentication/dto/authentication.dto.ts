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
  address? : Address

  @IsOptional()
  @Matches(/^((?:\+20|0020|20|0)?1[0125]\d{8}|(?:\+966|00966|966|0)?5\d{8}|(?:\+974|00974|974)?[3567]\d{7})$/)
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

  @Matches(/^((?:\+20|0020|20|0)?1[0125]\d{8}|(?:\+966|00966|966|0)?5\d{8}|(?:\+974|00974|974)?[3567]\d{7})$/)
  phone?: string;
}
export class SignWhitGoogleDTO {
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
export class ResetPasswordDTO extends LoginDTO {}
