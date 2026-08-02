import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { Auth,PermissionsDecorator, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/DB/models';
import { IPagination, IProductVariant } from 'src/common/interface';
import { CreateProductVariantDTO, PaginationDTO, UpdateProductVariantDTO } from 'src/common/dto';
import { AuthenticationGuard } from 'src/common/guard';
import { ProductVariantService } from './product-variant.service';
import { ObjectIdPipe } from 'src/common/pipe';
import { Types } from 'mongoose';
@Controller('product-variant')
export class ProductVariantController {
  constructor(private readonly ProductVariantService: ProductVariantService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_CREATE)
  @Post('create-product-variant')
  async create(@Body() data: CreateProductVariantDTO , @User() user : HUserDocument):Promise<IProductVariant> {
    return await this.ProductVariantService.create(data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_VIEW)
  @Get()
  async findAll(@Query()  query : PaginationDTO):Promise<IPagination<IProductVariant>> {
    return await this.ProductVariantService.findAll(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_VIEW)
  @Get('all-product-variants-archive')
  async findAllArchive(@Query()  query : PaginationDTO):Promise<IPagination<IProductVariant>> {
    return await this.ProductVariantService.findAllArchive(query);
  }

  @UseGuards(AuthenticationGuard)
  @PermissionsDecorator(PermissionEnum.PRODUCT_VIEW)
  @Get(':productVariantId')
  async findOne(@Param('productVariantId' , ObjectIdPipe) ProductVariantId: Types.ObjectId , @User() user : HUserDocument) : Promise<IProductVariant> {
    return await this.ProductVariantService.findOne(ProductVariantId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UPDATE)
  @Patch(':productVariantId/update')
  async update(@User() user : HUserDocument , @Param('productVariantId' , ObjectIdPipe) ProductVariantId: Types.ObjectId, @Body() data: UpdateProductVariantDTO): Promise<IProductVariant> {
    return await this.ProductVariantService.update(ProductVariantId, data , user);
  }
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UPDATE)
  @Patch('publish/:variantId')
  async publish(@Param( 'variantId' , ObjectIdPipe) variantId : Types.ObjectId , @User() user : HUserDocument):Promise<string> {
    return await this.ProductVariantService.publish(variantId , user);
  }
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UPDATE)
  @Patch('unpublish/:variantId')
  async unPublish(@Param( 'variantId' , ObjectIdPipe) variantId : Types.ObjectId , @User() user : HUserDocument):Promise<string> {
    return await this.ProductVariantService.unPublish(variantId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UPDATE)
  @Patch('soft-delete/:productVariantId')
  async softDelete(@Param('productVariantId' , ObjectIdPipe) ProductVariantId: Types.ObjectId, @User() user : HUserDocument): Promise<string> {
    return await this.ProductVariantService.softDelete(ProductVariantId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UPDATE)
  @Patch('restore/:ProductVariantId')
  async restore(@Param('productVariantId' , ObjectIdPipe) ProductVariantId: Types.ObjectId , @User() user : HUserDocument): Promise<string> {
    return await this.ProductVariantService.restore(ProductVariantId , user);
  }

}
