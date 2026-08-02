import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDefined, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min, MinLength, ValidateIf } from "class-validator";
import { IsFutureDate, IsGt, IsValidCoupon } from "src/common/decorator";
import { CouponTypeEnum } from "src/common/enum";
import { ICoupon } from "src/common/interface";

export class CreateCouponDto implements Partial<ICoupon> {
    @Transform(({value})=>
        typeof value === 'string' ? value.trim().toUpperCase().replace(/\s+/g,'-') : value,
    )
    @IsString()
    @MinLength(4)
    code!: string ;
    @IsString()
    image!: string ;
    @IsString()
    @IsOptional()
    @MinLength(2)
    description?: string ;
    @IsEnum(CouponTypeEnum)
    type!: CouponTypeEnum ;
    @IsNumber()
    @IsPositive()
    @IsValidCoupon(['type'])
    value!: number ;
    @IsNumber()
    @IsPositive()
    @ValidateIf((o) => o.type === CouponTypeEnum.PERCENT)
    @IsDefined({message : `maxDiscountAmount is required when coupon type is PERCENT`})
    maxDiscountAmount?: number ;
    @IsNumber()
    @IsPositive()
    minOrderAmount!: number ;
    @IsBoolean()
    isActive?: boolean ;
    @Type(()=> Date)
    @IsFutureDate()
    startAt!: Date ;
    @IsFutureDate()
    @IsGt(['startAt'])
    @Type(()=> Date)
    expiresAt!: Date ;
    @IsInt()
    @IsPositive()
    @Min(1)
    usageLimit!: number ;
}
