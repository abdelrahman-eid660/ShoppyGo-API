import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/DB/models';
import { IProduct } from 'src/common/interface';
import { PaginationDTO, ProductDto } from 'src/common/dto';
import { AuthenticationGuard } from 'src/common/guard';
import { ObjectIdPipe } from 'src/common/pipe';
import { Types } from 'mongoose';
import { UpdateProductDto } from './dto';
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_CREATE)
  @Post('create-product')
  async create(@Body() data: ProductDto , @User() user : HUserDocument):Promise<IProduct> {
    return await this.productService.create(data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UPDATE)
  @Patch(':productId/update')
  async update(@User() user : HUserDocument , @Param( 'productId' , ObjectIdPipe) productId : Types.ObjectId, @Body() data: UpdateProductDto) {
    return await this.productService.update(productId, data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_PUBLISH)
  @Patch('publish/:productId')
  async publish(@Param( 'productId' , ObjectIdPipe) productId : Types.ObjectId , @User() user : HUserDocument) {
    return await this.productService.publish(productId , user);
  }
  
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UNPUBLISH)
  @Patch('unpublish/:productId')
  async unPublish(@Param( 'productId' , ObjectIdPipe) productId : Types.ObjectId , @User() user : HUserDocument) {
    return await this.productService.unPublish(productId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UPDATE)
  @Patch('soft-delete/:productId')
  async softDelete(@Param( 'productId' , ObjectIdPipe) productId : Types.ObjectId , @User() user : HUserDocument) {
    return await this.productService.softDelete(productId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_UPDATE)
  @Patch('restore/:productId')
  async restore(@Param( 'productId' , ObjectIdPipe) productId : Types.ObjectId, @User() user : HUserDocument) {
    return await this.productService.restore(productId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PRODUCT_DELETE)
  @Delete('remove/:productId')
  async remove(@Param( 'productId' , ObjectIdPipe) productId : Types.ObjectId , @User() user : HUserDocument) {
    return await this.productService.remove(productId , user);
  }
}
