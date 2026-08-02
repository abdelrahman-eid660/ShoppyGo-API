import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryDto } from './create-inventory.dto';
import { IsInt, IsMongoId, IsOptional, IsPositive, Min } from 'class-validator';
import { IsGte } from 'src/common/decorator';
import { Types } from 'mongoose';

export class UpdateInventoryDto extends PartialType(CreateInventoryDto) {
        @IsInt()
        @Min(0)
        @IsOptional()
        @IsPositive()
        lowStockThreshold?: number;
        @IsInt()
        @Min(0)
        @IsPositive()
        @IsOptional()
        @IsGte(['lowStockThreshold'])
        quantity?: number;
        @IsMongoId()
        @IsOptional()
        wareHouseId!: Types.ObjectId;
}
