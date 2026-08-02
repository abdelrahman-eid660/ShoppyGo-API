import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseProductDto } from './create-purchase-product.dto';

export class UpdatePurchaseProductDto extends PartialType(CreatePurchaseProductDto) {}
