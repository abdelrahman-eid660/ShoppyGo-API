import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WarehouseTransformService } from './warehouse-transform.service';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { Types } from 'mongoose';
import { ObjectIdPipe } from 'src/common/pipe';
import { IPagination, IWareHouseTransform } from 'src/common/interface';
import type{ HUserDocument } from 'src/DB/models';
import { CreateWarehouseTransformDto, UpdateWarehouseTransformDto , PaginationWareHouseTransformDTO} from './dto';

@Controller('warehouse-transform')
export class WarehouseTransformController {
  constructor(private readonly warehouseTransformService: WarehouseTransformService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_CREATE)
  @Post('create-warehouse-transform')
  async create(@Body() data: CreateWarehouseTransformDto , @User() user : HUserDocument):Promise<IWareHouseTransform> {
    return await this.warehouseTransformService.create(data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_VIEW)
  @Get('all-warehouses-transform')
  async findAll(@Query() query : PaginationWareHouseTransformDTO):Promise<IPagination<IWareHouseTransform>> {
    return await this.warehouseTransformService.findAll(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_VIEW)
  @Get(':wareHouseTransfromId')
  async findOne(@Param('wareHouseTransfromId' , ObjectIdPipe) wareHouseTransfromId: Types.ObjectId): Promise<IWareHouseTransform> {
    return await this.warehouseTransformService.findOne(wareHouseTransfromId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_UPDATE)
  @Patch(':wareHouseTransfromId/update')
  async update(@Param('wareHouseTransfromId' , ObjectIdPipe) wareHouseTransfromId: Types.ObjectId, @Body() data: UpdateWarehouseTransformDto , @User() user : HUserDocument):Promise<IWareHouseTransform> {
    return await this.warehouseTransformService.update(wareHouseTransfromId, data , user);
  }
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_UPDATE)
  @Patch('cancel/:wareHouseTransfromId')
  async cancel(@Param('wareHouseTransfromId' , ObjectIdPipe) wareHouseTransfromId: Types.ObjectId , @User() user : HUserDocument):Promise<string> {
    return await this.warehouseTransformService.cancel(wareHouseTransfromId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_UPDATE)
  @Patch('approve/:wareHouseTransfromId')
  async approve(@Param('wareHouseTransfromId' , ObjectIdPipe) wareHouseTransfromId: Types.ObjectId , @User() user : HUserDocument):Promise<string> {
    return await this.warehouseTransformService.approve(wareHouseTransfromId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_UPDATE)
  @Patch('receive/:wareHouseTransfromId')
  async receive(@Param('wareHouseTransfromId' , ObjectIdPipe) wareHouseTransfromId: Types.ObjectId , @User() user : HUserDocument):Promise<string> {
    return await this.warehouseTransformService.receive(wareHouseTransfromId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_TRANSFORM_DELETE)
  @Delete(':wareHouseTransfromId')
  async remove(@Param('wareHouseTransfromId' , ObjectIdPipe) wareHouseTransfromId: Types.ObjectId , @User() user : HUserDocument): Promise<string> {
    return await this.warehouseTransformService.remove(wareHouseTransfromId , user);
  }
}
