import { IsBoolean, IsDefined, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { CouponTypeEnum } from 'src/common/enum';
import { IsFutureDate, IsGt, IsValidCoupon } from 'src/common/decorator';

export class UpdateCouponDto {
    @IsString()
    @IsOptional()
    @MinLength(2)
    description?: string ;
    @IsString()
    @IsOptional()
    image?: string ;
    @IsOptional()
    @IsEnum(CouponTypeEnum)
    type?: CouponTypeEnum ;
    @IsNumber()
    @IsPositive()
    @IsOptional()
    @IsValidCoupon(['type'])
    value?: number ;
    @IsNumber()
    @IsPositive()
    @ValidateIf((o) => o.type === CouponTypeEnum.PERCENT)
    @IsDefined({message : `maxDiscountAmount is required when coupon type is PERCENT`})
    maxDiscountAmount?: number ;
    @IsOptional()
    @IsNumber()
    @IsPositive()
    minOrderAmount?: number ;
    @IsOptional()
    @IsBoolean()
    isActive?: boolean ;
    @IsOptional()
    @Type(()=> Date)
    @IsFutureDate()
    startAt?: Date ;
    @IsOptional()
    @Type(()=> Date)
    @IsFutureDate()
    @IsGt(['startAt'])
    expiresAt?: Date ;
    @IsInt()
    @IsPositive()
    @IsOptional()
    @Min(1)
    usageLimit?: number ;
}
