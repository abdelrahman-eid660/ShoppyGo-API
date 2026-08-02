import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-cart.dto';
import { IsInt, IsMongoId, IsPositive } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateCartDto extends PartialType(CreateCartDto) {
    @IsInt()
    quantity!: number;
    @IsMongoId()
    variantId!: Types.ObjectId;
}
export class RemoveItemDTO {
    @IsMongoId()
    variantId!: Types.ObjectId;
}
