import {
  IWareHouseTransform,
  IWareHouseTransformItems,
} from 'src/common/interface';
import { SharedStatusEnum } from 'src/common/enum';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';
import { IWareHouseTransformItemsDto } from './create-warehouse-transform.dto';
import { IsFutureDate } from 'src/common/decorator';

export class UpdateWarehouseTransformDto implements Partial<IWareHouseTransform> {
  @IsMongoId()
  @IsOptional()
  fromWarehouseId?: Types.ObjectId;
  @IsMongoId()
  @IsOptional()
  toWarehouseId?: Types.ObjectId;
  @ValidateNested({each : true})
  @IsArray()
  @Type(() => IWareHouseTransformItemsDto)
  @ArrayNotEmpty()
  @IsOptional()
  items?: IWareHouseTransformItems[];
  @IsString()
  @IsOptional()
  notes?: string;
  @IsEnum(SharedStatusEnum)
  @IsNotEmpty()
  @IsOptional()
  status?: SharedStatusEnum;
  @IsFutureDate()
  @IsDate()
  @Type(()=> Date)
  @IsOptional()
  leaveAt?: Date;
}
