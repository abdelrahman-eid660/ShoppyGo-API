import { Module } from '@nestjs/common';
import { ProductVariantResolver } from './product-variant.resolver';
import {
  BrandModel,
  CartModel,
  CategoryModel,
  InventoryModel,
  InventoryMovementModel,
  OrderModel,
  ProductModel,
  PurchaseProductsModel,
  ReviewModel,
  StockAdjustmentModel,
  StockAlertModel,
  WareHouseTransformModel,
  WishlistModel,
} from 'src/DB/models';
import { S3Service } from 'src/common/service';
import {
  BrandRepository,
  CartRepository,
  CategoryRepository,
  InventoryMovementRepository,
  InventoryRepository,
  OrderRepository,
  ProductRepository,
  PurchaseProductsRepository,
  ReviewRepository,
  StockAdjustmentRepository,
  StockAlertRepository,
  WareHouseTransformRepository,
  WishlistRepository,
} from 'src/DB/Repository';
import { ProductVariantController } from './product.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import { ProductVariantService } from './product-variant.service';
import { DatabaseService } from 'src/DB/service/database.service';

@Module({
  imports: [
    ProductModel,
    SharedAuthenticationModule,
    BrandModel,
    CategoryModel,
    InventoryModel,
    InventoryMovementModel,
    PurchaseProductsModel,
    CartModel,
    ReviewModel,
    WishlistModel,
    StockAlertModel,
    StockAdjustmentModel,
    WareHouseTransformModel,
    OrderModel
  ],
  controllers: [ProductVariantController],
  providers: [
    ProductVariantResolver,
    ProductVariantService,
    BrandRepository,
    CategoryRepository,
    S3Service,
    ProductRepository,
    InventoryRepository,
    ReviewRepository,
    WishlistRepository,
    OrderRepository,
    StockAlertRepository,
    StockAdjustmentRepository,
    CartRepository,
    PurchaseProductsRepository,
    InventoryMovementRepository,
    WareHouseTransformRepository,
    DatabaseService
  ],
})
export class ProductVariantModule {}
