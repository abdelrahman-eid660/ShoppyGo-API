/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { OrderService } from 'src/modules/order/order.service';
import { OrderRepository } from './../../../DB/Repository';
import {Injectable } from "@nestjs/common";
import { Cron, CronExpression } from '@nestjs/schedule';
import { CancelReasonEnum, OrderStatusEnum, PaymentStatusEnum } from 'src/common/enum';
@Injectable()
export class OrderCleanupService {
    constructor(
        private readonly orderRepository : OrderRepository,
        private readonly orderService : OrderService,
    ){}

    @Cron(CronExpression.EVERY_30_MINUTES, {
        name : `Order cleanup`,
        timeZone : 'Africa/Cairo'
    })
    async handlePendingOrdersCleanup(){
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const expiredOrders = await this.orderRepository.find({
            filter : {
                status : OrderStatusEnum.PENDING, createdAt : {$lt : thirtyMinutesAgo},
                paymentStatus : {$in : [PaymentStatusEnum.PENDING, PaymentStatusEnum.PROCESSING]}
            }   
        });
        for (const order of expiredOrders) {
            try {
                await this.orderService.cancelOrder( order._id, 
                { _id: undefined as any, role: 'SYSTEM', name: 'Order Cleanup Cron Job' },
                { cancelReason: CancelReasonEnum.OTHER, cancelReasonOther: `Automatically cancelled by system because Order expired` }
                )
            } catch (error) {
                console.error(`Failed to auto-cancel order ${order._id}:`, error);
            }
        }
    }

}