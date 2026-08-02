import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import { CartModel, CouponModel, FinancialReviewModel, InventoryModel, InventoryMovementModel, OrderModel, PaymentModel, SettingsModel, ShippingZoneModel, WareHouseModel } from 'src/DB/models';
import { CartRepository, CouponRepository, FinancialReviewRepository, InventoryMovementRepository, InventoryRepository, OrderRepository, PaymentRepository, SettingsRepository, ShippingZoneRepository, WareHouseRepository } from 'src/DB/Repository';
import { DatabaseService } from 'src/DB/service/database.service';
import {  AdjustStockService, InventoryMovementService, OrderCleanupService, PaymentService } from 'src/common/service';
import { OrderResolver } from './order.resolver';

@Module({
  imports : [
    SharedAuthenticationModule , PaymentModel , WareHouseModel , ShippingZoneModel , CartModel ,
    CouponModel, InventoryModel , InventoryMovementModel , OrderModel ,
    FinancialReviewModel , SettingsModel 
  ],
  controllers: [OrderController],
  providers: [
    OrderService  , OrderCleanupService , CartRepository , 
    PaymentRepository , PaymentService , WareHouseRepository , ShippingZoneRepository , 
    CouponRepository , InventoryRepository , InventoryMovementRepository , InventoryMovementService ,
    OrderRepository , DatabaseService , FinancialReviewRepository ,
    SettingsRepository,AdjustStockService , OrderResolver
  ],
})
export class OrderModule {}
