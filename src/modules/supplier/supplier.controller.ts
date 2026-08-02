import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { IPagination, ISupplier } from 'src/common/interface';
import { ObjectIdPipe } from 'src/common/pipe';
import { Types } from 'mongoose';
import type{ HUserDocument } from 'src/DB/models';
import { PaginationDTO } from 'src/common/dto';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

@Controller('supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.SUPPLIER_ADD)
  @Post('add-supplier')
  async create(@Body() data: CreateSupplierDto , @User() user : HUserDocument):Promise<ISupplier> {
    return await this.supplierService.create(data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.SUPPLIER_VIEW)
  @Get('all-suppliers')
  async findAll(@Query() query : PaginationDTO):Promise<IPagination<ISupplier>> {
    return await this.supplierService.findAll(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.SUPPLIER_VIEW)
  @Get(':supplierId')
  async findOne(@Param('supplierId' , ObjectIdPipe) supplierId: Types.ObjectId):Promise<ISupplier> {
    return await this.supplierService.findOne(supplierId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.SUPPLIER_UPDATE)
  @Patch(':supplierId/update')
  async update(@Param('supplierId' , ObjectIdPipe) supplierId: Types.ObjectId, @Body() data: UpdateSupplierDto , @User() user : HUserDocument):Promise<ISupplier> {
    return await this.supplierService.update(supplierId, data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.SUPPLIER_DELETE)
  @Delete(':supplierId')
  async remove(@Param('supplierId' , ObjectIdPipe) supplierId: Types.ObjectId , @User() user : HUserDocument):Promise<string> {
    return await this.supplierService.remove(supplierId , user);
  }
}
