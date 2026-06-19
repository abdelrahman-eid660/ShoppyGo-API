import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductService } from './product.service';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/DB/models';
import { IProduct } from 'src/common/interface';
import { ProductDto } from 'src/common/dto';
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_CREATE)
  @Post('create-product')
  async create(@Body() data: ProductDto , @User() user : HUserDocument):Promise<IProduct> {
    return await this.productService.create(data , user);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get('get-product/:productId')
  findOne(@Param('productId') productId: string) {
    return this.productService.findOne(productId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UPDATE)
  @Patch(':productId/update')
  update(@User() user : HUserDocument , @Param('productId') productId: string, @Body() data: ProductDto) {
    return this.productService.update(productId, data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UPDATE)
  @Patch('soft-delete/:productId')
  async softDelete(@Param('productId') productId: string) {
    return await this.productService.softDelete(productId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UPDATE)
  @Patch('restore/:productId')
  async restore(@Param('productId') productId: string) {
    return await this.productService.restore(productId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_DELETE)
  @Delete('remove/:productId')
  remove(@Param('productId') productId: string) {
    return this.productService.remove(productId);
  }
}
