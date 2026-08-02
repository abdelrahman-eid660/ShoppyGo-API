import { PartialType } from '@nestjs/mapped-types';
import {
  CreateStockAdjustmentDto,
  IStockAdjustmentItemsDTO,
} from './create-stock-adjustment.dto';
import {
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IStockAdjustmentItems } from 'src/common/interface';
import { Types } from 'mongoose';

export class UpdateStockAdjustmentDto extends PartialType(
  CreateStockAdjustmentDto
) {
  @IsString()
  @IsOptional()
  notes?: string;
  @IsMongoId()
  @IsOptional()
  warehouseId?: Types.ObjectId;
  @ValidateNested({ each: true })
  @Type(() => IStockAdjustmentItemsDTO)
  @IsOptional()
  items?: IStockAdjustmentItems[];
}
