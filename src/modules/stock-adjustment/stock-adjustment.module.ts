import { Module } from '@nestjs/common';
import { StockAdjustmentService } from './stock-adjustment.service';
import { StockAdjustmentController } from './stock-adjustment.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import {
  FinancialReviewModel,
  InventoryModel,
  InventoryMovementModel,
  SettingsModel,
  StockAdjustmentModel,
  WareHouseModel,
} from 'src/DB/models';
import {
  FinancialReviewRepository,
  InventoryMovementRepository,
  InventoryRepository,
  SettingsRepository,
  StockAdjustmentRepository,
  WareHouseRepository,
} from 'src/DB/Repository';
import { DatabaseService } from 'src/DB/service/database.service';
import { DataBaseModule } from 'src/DB/service';
import {
  AdjustStockService,
  InventoryMovementService,
} from 'src/common/service';
import { StockAdjustmentResolver } from './stock-adjustment.resolver';

@Module({
  imports: [
    SharedAuthenticationModule,
    FinancialReviewModel,
    StockAdjustmentModel,
    InventoryMovementModel,
    InventoryModel,
    WareHouseModel,
    DataBaseModule,
    SettingsModel,
  ],
  controllers: [StockAdjustmentController],
  providers: [
    StockAdjustmentService,
    FinancialReviewRepository,
    StockAdjustmentRepository,
    InventoryMovementRepository,
    InventoryMovementService,
    WareHouseRepository,
    InventoryRepository,
    SettingsRepository,
    DatabaseService,
    AdjustStockService,
    StockAdjustmentResolver
  ],
  exports : [StockAdjustmentService]
})
export class StockAdjustmentModule {}
