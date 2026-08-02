import { Type } from 'class-transformer';
import {
    ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDate,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { IsFutureDate } from 'src/common/decorator';
import { IPurchaseItems, IPurchaseProducts } from 'src/common/interface';
export class PruchaseItemsDTO {
  @IsMongoId()
  @IsNotEmpty()
  productVariantId!: Types.ObjectId;
  @IsInt()
  @IsPositive()
  orderedQuantity!: number;
}
export class CreatePurchaseProductDto implements Partial<IPurchaseProducts> {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique(item => item.productVariantId)
  @ValidateNested({each : true})
  @ArrayMinSize(1)
  @Type(() => PruchaseItemsDTO)
  items!: IPurchaseItems[];
  @IsNotEmpty()
  @IsMongoId()
  supplierId!: Types.ObjectId;
  @IsNotEmpty()
  @IsMongoId()
  wareHouseId!: Types.ObjectId;
  @Type(() => Date)
  @IsDate()
  @IsFutureDate()
  expectedAt!: Date;
}
