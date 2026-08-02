import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PermissionEnum } from "src/common/enum";
import { AnalyticsService } from "src/modules/analytics/analytics.service";
import { RealtimeGetway } from "src/modules/realtime";

@Injectable()
export class AnalyticsListener {
    constructor(
        private readonly realtimeGetway : RealtimeGetway,
        private readonly analyticsService : AnalyticsService
    ){}

    @OnEvent('order.delivered')
    async handleOrderDelivered(){
        const metrics = await this.analyticsService.getSalesOverviewMetrics();
        await this.realtimeGetway.sendToPermission(PermissionEnum.ANALYTICES_VIEW,'metrics_salesOverview_update',metrics);
    }
    @OnEvent('order.confirmed')
    async handleOrderConfirmed(){
        const metrics = await this.analyticsService.getSalesOverviewMetrics();
        await this.realtimeGetway.sendToPermission(PermissionEnum.ANALYTICES_VIEW,'metrics_salesOverview_update',metrics);
    }

}