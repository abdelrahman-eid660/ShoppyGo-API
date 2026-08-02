import { Module } from '@nestjs/common';
import { WarehouseTransformService } from './warehouse-transform.service';
import { WarehouseTransformController } from './warehouse-transform.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import { InventoryModel, InventoryMovementModel, WareHouseModel, WareHouseTransformModel } from 'src/DB/models';
import { InventoryMovementRepository, InventoryRepository, WareHouseRepository, WareHouseTransformRepository } from 'src/DB/Repository';
import { InventoryMovementService } from 'src/common/service';
import { DataBaseModule } from 'src/DB/service';

@Module({
  imports : [SharedAuthenticationModule , WareHouseTransformModel , WareHouseModel , InventoryModel , InventoryMovementModel , DataBaseModule],
  controllers: [WarehouseTransformController],
  providers: [WarehouseTransformService , WareHouseTransformRepository , WareHouseRepository,InventoryMovementRepository,InventoryRepository  , InventoryMovementService],
})
export class WarehouseTransformModule {}
