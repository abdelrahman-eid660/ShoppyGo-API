import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandSupplierDto } from './create-brand-supplier.dto';
import { IsBoolean, IsOptional } from 'class-validator';
export class UpdateBrandSupplierDto extends PartialType(CreateBrandSupplierDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean | undefined;
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean | undefined;
}
