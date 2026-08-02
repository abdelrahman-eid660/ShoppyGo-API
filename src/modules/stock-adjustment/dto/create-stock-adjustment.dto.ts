import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { StockAdjustmentReasonEnum } from 'src/common/enum';
import { IStockAdjustment, IStockAdjustmentItems } from 'src/common/interface';

export class IStockAdjustmentItemsDTO {
  @IsMongoId()
  productVariantId!: Types.ObjectId;
  @IsInt()
  @Min(1)
  @IsPositive()
  countedQuantity!: number;
  @IsEnum(StockAdjustmentReasonEnum)
  reason!: StockAdjustmentReasonEnum;
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ValidateIf((r) => r.reason === StockAdjustmentReasonEnum.OTHER)
  customeResone?: string;
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  notes?: string;
}

export class CreateStockAdjustmentDto implements Partial<IStockAdjustment> {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  notes?: string;
  @IsMongoId()
  warehouseId!: Types.ObjectId;
  @ValidateNested({ each: true })
  @Type(() => IStockAdjustmentItemsDTO)
  items!: IStockAdjustmentItems[];
}
