import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CreateShippingZoneDto, UpdateShippingZoneDto } from './dto';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/DB/models';
import { Types } from 'mongoose';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { IPagination, IShippingZone } from 'src/common/interface';
import { ShippingZoneService } from './shipping-zone.service';
import { PaginationDTO } from 'src/common/dto';

@Controller('shipping-zone')
export class ShippingZoneController {
  constructor(private readonly ShippingZoneService: ShippingZoneService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.SHIPPING_ZONE_CREATE)
  @Post('create-shipping-zone')
  async create(@Body() data: CreateShippingZoneDto , @User() user : HUserDocument): Promise<IShippingZone> {
    return await this.ShippingZoneService.create(data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.SHIPPING_ZONE_VIEW)
  @Get('all-shipping-zones')
  async findAll(@Query() query : PaginationDTO) : Promise<IPagination<IShippingZone>>{
    return await this.ShippingZoneService.findAll(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.SHIPPING_ZONE_VIEW)
  @Get(':shippingId')
  async findOne(@Param('shippingId') shippingId: Types.ObjectId) : Promise<IShippingZone> {
    return await this.ShippingZoneService.findOne(shippingId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.SHIPPING_ZONE_UPDATE)
  @Patch(':shippingId/update')
  async update(@Param('shippingId') shippingId: Types.ObjectId, @Body() data: UpdateShippingZoneDto , @User() user : HUserDocument) : Promise<IShippingZone>{
    return await this.ShippingZoneService.update(shippingId, data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.SHIPPING_ZONE_DELETE)
  @Delete(':shippingId')
  async remove(@Param('shippingId') shippingId: Types.ObjectId, @User() user : HUserDocument): Promise<string> {
    return await this.ShippingZoneService.remove(shippingId , user);
  }
}
