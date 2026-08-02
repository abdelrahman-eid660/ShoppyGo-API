import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProductSupplierService } from './product_supplier.service';
import { CreateProductSupplierDto } from './dto/create-product_supplier.dto';
import { UpdateProductSupplierDto } from './dto/update-product_supplier.dto';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/DB/models';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { IPagination, IProductSupplier } from 'src/common/interface';
import { Types } from 'mongoose';
import { ObjectIdPipe } from 'src/common/pipe';
import { PaginationDTO } from 'src/common/dto';

@Controller('product-supplier')
export class ProductSupplierController {
  constructor(private readonly productSupplierService: ProductSupplierService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_SUPPLIER_ADD)
  @Post('add-product-supplier')
  async create(@Body() data: CreateProductSupplierDto , @User() user : HUserDocument):Promise<IProductSupplier> {
    return await this.productSupplierService.create(data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_SUPPLIER_VIEW)
  @Get('all-product-suppliers')
  async findAll(@Query() query : PaginationDTO): Promise<IPagination<IProductSupplier>> {
    return await this.productSupplierService.findAll(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_SUPPLIER_VIEW)
  @Get(':productSupplierId')
  async findOne(@Param('productSupplierId' , ObjectIdPipe) productSupplierId: Types.ObjectId): Promise<IProductSupplier> {
    return await this.productSupplierService.findOne(productSupplierId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_SUPPLIER_UPDATE)
  @Patch(':productSupplierId/update')
  async update(@Param('productSupplierId' , ObjectIdPipe) productSupplierId: Types.ObjectId, @Body() data: UpdateProductSupplierDto , @User() user : HUserDocument):Promise<IProductSupplier> {
    return await this.productSupplierService.update(productSupplierId, data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_SUPPLIER_DELETE)
  @Delete(':productSupplierId')
  async remove(@Param('productSupplierId' , ObjectIdPipe) productSupplierId: Types.ObjectId , @User() user : HUserDocument) : Promise<string> {
    return await this.productSupplierService.remove(productSupplierId , user );
  }
}
