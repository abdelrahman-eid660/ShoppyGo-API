import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { InventoryMovementService } from './inventory-movement.service';
import { Types } from 'mongoose';
import { Auth, PermissionsDecorator } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { ObjectIdPipe } from 'src/common/pipe';
import { GetAllInvMovementDTO } from './dto';
import { IInventoryMovement, IPagination } from 'src/common/interface';

@Controller('inventory-movement')
export class InventoryMovementController {
  constructor(private readonly inventoryMovementService: InventoryMovementService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.INVENTORY_MOVEMENT_VIEW)
  @Get('all-inventory-movement')
  async findAll(@Query() query : GetAllInvMovementDTO):Promise<IPagination<IInventoryMovement>> {
    return await this.inventoryMovementService.findAll(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.INVENTORY_MOVEMENT_VIEW)
  @Get(':inventoryMovementId')
  async findOne(@Param('inventoryMovementId' , ObjectIdPipe) inventoryMovementId: Types.ObjectId) : Promise<IInventoryMovement> {
    return await this.inventoryMovementService.findOne(inventoryMovementId);
  }

}
