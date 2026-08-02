import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { IBrandSupplier } from 'src/common/interface';

export class CreateBrandSupplierDto implements Partial<IBrandSupplier> {
  @IsMongoId()
  brandId!: Types.ObjectId;
  @IsMongoId()
  supplierId!: Types.ObjectId;
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
