import { PartialType } from '@nestjs/mapped-types';
import { CreateShippingZoneDto } from './create-shipping-zone.dto';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { governorateEnum } from 'src/common/enum';

export class UpdateShippingZoneDto extends PartialType(CreateShippingZoneDto) {
  @IsInt()
  @IsPositive()
  @Min(1)
  @IsOptional()
  estimatedDays?: number;
  @IsOptional()
  @IsEnum(governorateEnum)
  governorate?: governorateEnum;
  @IsPositive()
  @IsOptional()
  @IsNumber()
  price?: number;
  @IsPositive()
  @IsOptional()
  @IsNumber()
  mainCost?: number;
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
