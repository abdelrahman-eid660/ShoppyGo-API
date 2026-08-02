import { SharedCurrencyEnum } from 'src/common/enum';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class ChangeBaseCurrencyDTO {
  @Transform(({value})=> value.toUpperCase())
  @IsEnum(SharedCurrencyEnum)
  baseCurrency! : SharedCurrencyEnum
}
export class AddSubCurrencyDTO {
  @IsString()
  @IsNotEmpty()
  @Length(3,3)
  code!: string;
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;
}
export class RemoveSubCurrencyDTO {
  @IsString()
  @IsNotEmpty()
  @Length(3,3)
  code!: string;
}
export class ChangeProjectNameDTO {
  @IsString()
  @IsNotEmpty()
  projectName!: string;
}
export class ChangeLogoDTO {
  @IsString()
  @IsNotEmpty()
  logoUrl!: string;
}
export class ChangeReturnPolicyDaysDTO {
  @IsInt()
  @IsNotEmpty()
  returnPolicyDays!: number;
}
