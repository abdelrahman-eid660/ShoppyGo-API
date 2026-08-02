import { Module } from "@nestjs/common";
import { CouponModel, OrderModel } from "src/DB/models";
import { CouponRepository, OrderRepository } from "src/DB/Repository";
import { OrderService } from "src/modules/order/order.service";
import { OrderCleanupService } from "./cron-job.service";

@Module({
    imports : [OrderModel , CouponModel],
    providers:  [OrderRepository , CouponRepository , OrderService],
    exports : [OrderCleanupService]
})
export class CronJobModule{}