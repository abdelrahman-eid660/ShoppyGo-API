import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationDTO } from 'src/common/dto';
import { CouponTypeEnum } from 'src/common/enum';

export class AllCouponDTO extends PaginationDTO {
  @IsOptional()
  @IsEnum(CouponTypeEnum)
  type?: CouponTypeEnum;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
