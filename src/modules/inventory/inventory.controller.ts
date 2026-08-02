import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/DB/models';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { Types } from 'mongoose';
import { ObjectIdPipe } from 'src/common/pipe';
import { PaginationDTO } from 'src/common/dto';
import { IInventory } from 'src/common/interface';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}
  @Auth({roles :[ RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.INVENTORY_ADD)
  @Post('add-to-inventory')
  create(@Body() data: CreateInventoryDto , @User() user : HUserDocument):Promise<IInventory> {
    return this.inventoryService.create(data , user);
  }

  @Auth({roles :[ RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.INVENTORY_VIEW)
  @Get('all-inventory')
  findAll(@Query() query : PaginationDTO) {
    return this.inventoryService.findAll(query);
  }

  @Auth({roles :[ RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.INVENTORY_UPDATE)
  @Patch(':inventoryId/update')
  update(@Param('inventoryId' , ObjectIdPipe) inventoryId: Types.ObjectId, @Body() data: UpdateInventoryDto , @User() user : HUserDocument):Promise<IInventory> {
    return this.inventoryService.update(inventoryId, data , user);
  }
  @Auth({roles :[ RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.INVENTORY_DELETE)
  @Delete(':inventoryId')
  remove(@Param('inventoryId' , ObjectIdPipe) inventoryId: Types.ObjectId , @User() user : HUserDocument):Promise<string> {
    return this.inventoryService.remove(inventoryId , user);
  }
}
