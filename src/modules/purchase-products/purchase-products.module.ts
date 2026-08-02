import { Module } from '@nestjs/common';
import { PurchaseProductsService } from './purchase-products.service';
import { PurchaseProductsController } from './purchase-products.controller';
import {
  FinancialReviewModel,
  InventoryModel,
  InventoryMovementModel,
  ProductSupplierModel,
  PurchaseProductsModel,
  SettingsModel,
  SupplierModel,
  WareHouseModel,
} from 'src/DB/models';
import {
  FinancialReviewRepository,
  InventoryMovementRepository,
  InventoryRepository,
  ProductSupplierRepository,
  PurchaseProductsRepository,
  SettingsRepository,
  SupplierRepository,
  WareHouseRepository,
} from 'src/DB/Repository';
import { SharedAuthenticationModule } from 'src/common/modules';
import { DataBaseModule } from 'src/DB/service';
import { AdjustStockService, InventoryMovementService } from 'src/common/service';
import { PurchaseProductsResolver } from './purchase-products.resolver';

@Module({
  imports: [
    InventoryModel,
    SupplierModel,
    WareHouseModel,
    PurchaseProductsModel,
    InventoryMovementModel,
    SharedAuthenticationModule,
    ProductSupplierModel,
    FinancialReviewModel,
    SettingsModel,
    DataBaseModule,
  ],
  controllers: [PurchaseProductsController],
  providers: [
    PurchaseProductsService,
    InventoryRepository,
    WareHouseRepository,
    InventoryMovementRepository,
    SupplierRepository,
    PurchaseProductsRepository,
    ProductSupplierRepository,
    InventoryMovementService,
    SettingsRepository,
    FinancialReviewRepository,
    AdjustStockService,
    PurchaseProductsResolver
  ],
  exports:[PurchaseProductsService]
})
export class PurchaseProductsModule {}
