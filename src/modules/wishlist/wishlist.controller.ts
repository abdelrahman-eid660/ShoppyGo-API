import { Controller, Get, Post, Body, Param, Delete, UseInterceptors } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto, RemoveItemFromWishlistDto } from './dto';
import { Auth, CacheKey, User } from 'src/common/decorator';
import { Types } from 'mongoose';
import { ObjectIdPipe } from 'src/common/pipe';
import type{ HUserDocument } from 'src/DB/models';
import { IWishlist } from 'src/common/interface';
import { CacheKeyEnum } from 'src/common/enum';
import { CustomeCacheInterceptor } from 'src/common/interceptor';
@Auth({})
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  create(@Body() data: CreateWishlistDto ,@User() user : HUserDocument):Promise<IWishlist> {
    return this.wishlistService.create(data , user);
  }

  @CacheKey(CacheKeyEnum.WISHLIST)
  @UseInterceptors(CustomeCacheInterceptor)
  @Get(':wishlistId')
  async findOne(@Param('wishlistId' , ObjectIdPipe) wishlistId: Types.ObjectId , @User() user : HUserDocument):Promise<IWishlist> {
    return await this.wishlistService.findOne(wishlistId , user);
  }

  @Delete(':wishlistId/remove/:variantId')
  async remove(@Param('wishlistId') wishlistId: Types.ObjectId , data : RemoveItemFromWishlistDto, @User() user : HUserDocument):Promise<IWishlist> {
    return await this.wishlistService.remove(wishlistId , data , user);
  }
}
