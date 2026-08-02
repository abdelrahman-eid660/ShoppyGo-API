import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsNumber, IsPositive, Min } from "class-validator";
import { governorateEnum } from "src/common/enum";
import { IShippingZone } from "src/common/interface";

export class CreateShippingZoneDto implements Partial<IShippingZone> {
    @IsInt()
    @IsPositive()
    @Min(1)
    estimatedDays!: number;
    @IsEnum(governorateEnum)
    @Transform(({value})=> value.toLowerCase())
    governorate!: governorateEnum;
    @IsPositive()
    @IsNumber()
    price!: number;
    @IsPositive()
    @IsNumber()
    mainCost!: number;
    @IsBoolean()
    isActive!: boolean;
}
