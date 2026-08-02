import type{ HUserDocument } from './../../DB/models/user.model';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors } from '@nestjs/common';
import { CartService } from './cart.service';
import { CacheKey, PermissionsDecorator, User } from 'src/common/decorator';
import {  CreateCartDto, RemoveItemDTO, UpdateCartDto } from './dto';
import { ObjectIdPipe } from 'src/common/pipe';
import { Types } from 'mongoose';
import { CacheKeyEnum, PermissionEnum } from 'src/common/enum';
import { AuthenticationGuard } from 'src/common/guard';
import { CartCacheInterceptor, CustomeCacheInterceptor } from 'src/common/interceptor';
import { Throttle } from '@nestjs/throttler';

@UseGuards(AuthenticationGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}
 
  @PermissionsDecorator(PermissionEnum.CART_ADD_ITEM)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('add-to-cart')
  async create(@Body() data: CreateCartDto , @User() user : HUserDocument) {
    return await this.cartService.create(data , user);
  }

  @PermissionsDecorator(PermissionEnum.CART_VIEW)
  @UseInterceptors(CustomeCacheInterceptor)
  @CacheKey(CacheKeyEnum.CART)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get(':cartId')
  async findOne(@Param('cartId' , ObjectIdPipe) cartId: Types.ObjectId , @User() user : HUserDocument) {
    return await this.cartService.findOne(cartId , user);
  }

  @Patch(':cartId/update')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.CART_UPDATE_ITEM)
  async update(@Param('cartId' , ObjectIdPipe) cartId: Types.ObjectId, @Body() data: UpdateCartDto , @User() user : HUserDocument) {
    return await this.cartService.update(cartId, data , user);
  }

  @PermissionsDecorator(PermissionEnum.CART_CLEAR)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Patch('remove-item/:cartId')
  async remove(@Param('cartId' , ObjectIdPipe) cartId: Types.ObjectId ,@Body() variantId : RemoveItemDTO , @User() user : HUserDocument) {
    return await this.cartService.remove(cartId , variantId , user);
  }

  @PermissionsDecorator(PermissionEnum.CART_CLEAR)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Delete('clear-cart/:cartId')
  async removeAll(@Param('cartId' , ObjectIdPipe) cartId: Types.ObjectId , @User() user : HUserDocument) {
    return await this.cartService.removeAll(cartId , user);
  }
}
