/* eslint-disable @typescript-eslint/no-floating-promises */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import {
  NotificationRepository,
  StockAlertRepository,
  ProductVariantRepository,
} from './../../DB/Repository';
import {
  ActionStockTypeEnum,
  NotificationTypeEnum,
  PermissionEnum,
  ReferenceModelEnum,
} from '../enum';
import { RealtimeGetway } from 'src/modules/realtime';
import { FCMRedisService, FCMService } from '../service';

export interface IStockChangedPayload {
  inventoryId: string;
  productVariantId: string;
  sku: string;
  productTitle?: string;
  warehouseId: string;
  warehouseName?: string;
  previousAvailableQuantity: number;
  newAvailableQuantity: number;
  lowStockThreshold: number;
  actionType: ActionStockTypeEnum;
}

export interface IPurchaseReceivedPayload {
  purchaseProductId: Types.ObjectId;
  status: string;
  receivedBy: Types.ObjectId;
  supplierNameSnapshot: string;
  items?: Array<{
    productVariantId: Types.ObjectId | string;
    receivedQuantity: number;
  }>;
}

@Injectable()
export class StockAlertListener {
  private readonly logger = new Logger(StockAlertListener.name);

  constructor(
    private readonly stockAlertRepository: StockAlertRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly realtimeGetway: RealtimeGetway,
    private readonly fcmRedisService: FCMRedisService,
    private readonly fcmService: FCMService
  ) {}
  

  @OnEvent('inventory.stock_changed', { async: true })
  async handleLowStockWarning(payload: IStockChangedPayload) {
    try {
        const {actionType,inventoryId,lowStockThreshold,newAvailableQuantity,
            previousAvailableQuantity,productVariantId,sku,warehouseId,
            productTitle,warehouseName,
        } = payload;
      if (newAvailableQuantity <= lowStockThreshold &&previousAvailableQuantity > lowStockThreshold) {
            this.realtimeGetway.sendToPermission(PermissionEnum.INVENTORY_VIEW,'low_stock_alert',
            {
            event: 'low_stock_waring',
            message: `Warning: ${productTitle || sku} has reached the minimum stock level (${newAvailableQuantity} remaining).`,
            data: {
              inventoryId,productVariantId,sku,warehouseId,remainingQuantity: newAvailableQuantity,
              lowStockThreshold,actionType,warehouseName,
            },
            timestamp: new Date(),
          }
        );
      }
    } catch (error: any) {
      this.logger.error('Error processing low stock warning event:', error);
    }
  }

  @OnEvent('purchase.received', { async: true })
  async handlePurchaseReceivedStockAlert(data: IPurchaseReceivedPayload) {
    try {
      if (!data.items || data.items.length === 0) return;

      const variantIds = data.items.map(
        (i) => new Types.ObjectId(i.productVariantId.toString())
      );

      const pendingAlerts = await this.stockAlertRepository.find({
        filter: {
          productVariantId: { $in: variantIds },
          isNotified: false,
        },
      });

      if (!pendingAlerts.length) return;

      const variants = await this.productVariantRepository.find({
        filter: { _id: { $in: variantIds } },
      });
      const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

      const notificationsDocs: any[] = [];
      const recipientUserIds: string[] = [];
      const notifiedAlertIds: Types.ObjectId[] = [];

      for (const alert of pendingAlerts) {
        const variantIdStr = alert.productVariantId.toString();
        const variant = variantMap.get(variantIdStr);
        const recipientId = alert.createdBy.toString();
        const productName = variant?.sku || 'Product';

        const title = 'Back in Stock! 🎉';
        const body = `Great news! "${productName}" is back in stock. Order yours now before it runs out!`;

        notificationsDocs.push({
          insertOne: {
            document: {
              recipientId: alert.createdBy,title,body,type: NotificationTypeEnum.STOCK_ALERT,
              isRead: false,isSystem: true,referenceId: alert.
              productVariantId,referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
            },
          },
        });

        this.realtimeGetway.sendToUser(recipientId, 'new_notification', {
          title,
          body,
          referenceId: alert.productVariantId,
          referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
          type: NotificationTypeEnum.STOCK_ALERT,
          createdAt: new Date(),
        });

        recipientUserIds.push(recipientId);
        notifiedAlertIds.push(alert._id);
      }

      if (notificationsDocs.length > 0) {
        await this.notificationRepository.bulkWrite(notificationsDocs, {
          ordered: false,
        });
      }

      const fcmTokens =
        await this.fcmRedisService.getFCMsMulti(recipientUserIds);
      if (fcmTokens.length > 0) {
        const results = await this.fcmService.sendNotifications({
          tokens: fcmTokens,
          data: {
            title: 'Back in Stock! 🎉',
            body: 'Items you were watching are now available!',
          },
        });

        for (const [index, result] of results.entries()) {
          if (result.status === 'rejected') {
            const code = result.reason?.errorInfo?.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/mismatched-credential'
            ) {
              await this.fcmRedisService.removeFCMUser(
                fcmTokens[index].toString()
              );
            }
          }
        }
      }

      await this.stockAlertRepository.updateMany({
        filter: { _id: { $in: notifiedAlertIds } },
        update: { $set: { isNotified: true } },
      });
    } catch (error: any) {
      this.logger.error(
        'Error processing purchase received stock alert:',
        error
      );
    }
  }
}
