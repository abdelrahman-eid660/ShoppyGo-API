import { Module } from '@nestjs/common';
import { InventoryMovementService } from './inventory-movement.service';
import { InventoryMovementController } from './inventory-movement.controller';
import { InventoryMovementModel } from 'src/DB/models';
import { InventoryMovementRepository } from 'src/DB/Repository';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports : [InventoryMovementModel , SharedAuthenticationModule],
  controllers: [InventoryMovementController],
  providers: [InventoryMovementService , InventoryMovementRepository],
})
export class InventoryMovementModule {}
