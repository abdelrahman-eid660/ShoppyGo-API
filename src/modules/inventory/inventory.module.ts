import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryModel, ProductVariantModel, WareHouseModel } from 'src/DB/models';
import { InventoryRepository, ProductVariantRepository, WareHouseRepository } from 'src/DB/Repository';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports : [ProductVariantModel , InventoryModel , SharedAuthenticationModule , WareHouseModel],
  controllers: [InventoryController],
  providers: [InventoryService , ProductVariantRepository , InventoryRepository , WareHouseRepository],
})
export class InventoryModule {}
