import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import { CartModel, InventoryModel, ProductVariantModel } from 'src/DB/models';
import { CartRepository, InventoryRepository, ProductVariantRepository } from 'src/DB/Repository';

@Module({
  imports : [SharedAuthenticationModule , CartModel , ProductVariantModel , InventoryModel],
  controllers: [CartController],
  providers: [CartService , ProductVariantRepository , CartRepository , InventoryRepository ],
})
export class CartModule {}
