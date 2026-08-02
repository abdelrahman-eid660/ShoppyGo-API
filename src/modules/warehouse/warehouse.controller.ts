import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import type{ HUserDocument } from 'src/DB/models';
import { IPagination, IWareHouse } from 'src/common/interface';
import { CreateWarehouseDto, UpdateWarehouseDto , WareHousePaginationDTO } from './dto';
import { Types } from 'mongoose';
import { ObjectIdPipe } from 'src/common/pipe';

@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_CREATE)
  @Post('create-warehouse')
  async create(@Body() data: CreateWarehouseDto , @User() user : HUserDocument):Promise<IWareHouse> {
    return await this.warehouseService.create(data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_VIEW)
  @Get('all-warehouses')
  async findAll(@Query() query : WareHousePaginationDTO):Promise<IPagination<IWareHouse>> {
    return await this.warehouseService.findAll(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_VIEW)
  @Get(':wareHouseId')
  async findOne(@Param('wareHouseId' , ObjectIdPipe) wareHouseId: Types.ObjectId): Promise<IWareHouse> {
    return await this.warehouseService.findOne(wareHouseId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_UPDATE)
  @Patch(':wareHouseId/update')
  async update(@Param('wareHouseId' , ObjectIdPipe) wareHouseId: Types.ObjectId, @Body() data: UpdateWarehouseDto , @User() user : HUserDocument):Promise<IWareHouse> {
    return await this.warehouseService.update(wareHouseId, data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.WAREHOUSE_DELETE)
  @Delete(':wareHouseId')
  async remove(@Param('wareHouseId' , ObjectIdPipe) wareHouseId: Types.ObjectId , @User() user : HUserDocument): Promise<string> {
    return await this.warehouseService.remove(wareHouseId , user);
  }
}
