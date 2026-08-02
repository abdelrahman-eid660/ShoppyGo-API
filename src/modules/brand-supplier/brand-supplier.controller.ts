import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BrandSupplierService } from './brand-supplier.service';
import { CreateBrandSupplierDto , UpdateBrandSupplierDto } from './dto';
import { Types } from 'mongoose';
import { ObjectIdPipe } from 'src/common/pipe';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/DB/models';
import { PaginationDTO } from 'src/common/dto';
import { IBrandSupplier, IPagination } from 'src/common/interface';
import { PermissionEnum, RoleEnum } from 'src/common/enum';

@Controller('brand-supplier')
export class BrandSupplierController {
  constructor(private readonly brandSupplierService: BrandSupplierService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_SUPPLIER_ADD)
  @Post('create-brand-supplier')
  async create(@Body() data: CreateBrandSupplierDto , @User() user : HUserDocument): Promise<IBrandSupplier> {
    return await this.brandSupplierService.create(data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.BRAND_SUPPLIER_VIEW)
  @Get('all-brands-supplier')
  async findAll(@Query() query : PaginationDTO) : Promise<IPagination<IBrandSupplier>> {
    return await this.brandSupplierService.findAll(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.BRAND_SUPPLIER_VIEW)
  @Get(':brandSupplierId')
  async findOne(@Param('brandSupplierId' , ObjectIdPipe) brandSupplierId: Types.ObjectId) : Promise<IBrandSupplier> {
    return await this.brandSupplierService.findOne(brandSupplierId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_SUPPLIER_UPDATE)
  @Patch(':brandSupplierId/update')
  async update(@Param('brandSupplierId' , ObjectIdPipe) brandSupplierId: Types.ObjectId, @Body() data: UpdateBrandSupplierDto , @User() user : HUserDocument): Promise<IBrandSupplier> {
    return await this.brandSupplierService.update(brandSupplierId, data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_SUPPLIER_DELETE)
  @Delete('remove/:brandSupplierId')
  async remove(@Param('brandSupplierId' , ObjectIdPipe) brandSupplierId: Types.ObjectId , @User() user : HUserDocument) :Promise<string> {
    return await this.brandSupplierService.remove(brandSupplierId , user);
  }
}
