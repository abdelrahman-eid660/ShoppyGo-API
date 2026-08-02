import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import {ProductModel, WishlistModel } from 'src/DB/models';
import { SharedAuthenticationModule } from 'src/common/modules';
import { ProductRepository, WishlistRepository } from 'src/DB/Repository';

@Module({
  imports : [WishlistModel , SharedAuthenticationModule , ProductModel],
  controllers: [WishlistController],
  providers: [WishlistService , WishlistRepository ,ProductRepository ],
})
export class WishlistModule {}
