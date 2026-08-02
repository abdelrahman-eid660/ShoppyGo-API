import { PartialType } from '@nestjs/mapped-types';
import { CreateStockAlertDto } from './create-stock-alert.dto';

export class UpdateStockAlertDto extends PartialType(CreateStockAlertDto) {}
