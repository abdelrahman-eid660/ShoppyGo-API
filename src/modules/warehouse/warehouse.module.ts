import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { InventoryRepository, PurchaseProductsRepository, WareHouseRepository } from 'src/DB/Repository';
import { InventoryModel, PurchaseProductsModel, WareHouseModel } from 'src/DB/models';
import { S3Service } from 'src/common/service';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports : [WareHouseModel , SharedAuthenticationModule , InventoryModel , PurchaseProductsModel],
  controllers: [WarehouseController],
  providers: [WarehouseService , WareHouseRepository , S3Service , PurchaseProductsRepository , InventoryRepository],
})
export class WarehouseModule {}
