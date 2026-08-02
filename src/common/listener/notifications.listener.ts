/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationRepository, UserRepository } from 'src/DB/Repository';
import { RealtimeGetway } from 'src/modules/realtime';
import { CurrencyEnum, FinancialCategoryEnum, FinancialSourceEnum, governorateEnum, NotificationTypeEnum, PaymentMethodEnum, PermissionEnum, PurchaseProcessStatusEnum, ReferenceModelEnum, RefundResoneEnum, RefundTypeEnum, RoleEnum, SharedCurrencyEnum } from '../enum';
import {FCMRedisService, FCMService } from '../service';
import type{ Address, INotificationPayload, IPurchaseEventPayload } from '../interface';
import { Types } from 'mongoose';

@Injectable()
export class NotificationsListener {
    private logger = new Logger()
  constructor(
    private readonly realTimeGetway: RealtimeGetway,
    private readonly notificationRepository: NotificationRepository,
    private readonly userRepository: UserRepository,
    private readonly fcmRedisService : FCMRedisService,
    private readonly fcmService : FCMService,
  ) {}

  
  //======================== Notification of purchase ====================================
    private async dashboardNotification({permission,title,body,referenceId,eventName,payload , type , referenceModel , recipientId , roles}: INotificationPayload) {
      try {
        if (roles.includes(RoleEnum.USER)) {
            await this.notificationRepository.createOne({
                data: {
                    title,body,isRead: false,isSystem: true,
                    recipientId,referenceId,referenceModel,
                    type,
                },
            });
            this.realTimeGetway.sendToUser(recipientId!.toString() as string, 'new_notification', {
                title,body,referenceId,referenceModel: ReferenceModelEnum.ORDER,
                type: NotificationTypeEnum.ORDER,createdAt: new Date(),
            });
            this.realTimeGetway.sendToUser(recipientId!.toString() as string, eventName, payload);
            const fcmTokens = await this.fcmRedisService.getFCMs(recipientId!.toString() as string);
            if (fcmTokens && fcmTokens.length > 0) {
                await this.fcmService.sendNotifications({tokens: fcmTokens,data: { title, body }});
            }
        }else if (roles.some(role => [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR].includes(role))){
            const targetUsers = await this.userRepository.find({filter: {permissions: permission,role : {$in: roles}}});
            if (!targetUsers.length) return;
            const userIds = targetUsers.map((u) => u._id);
            const notificationsDocs = userIds.map((userId) => ({
                insertOne: {document: {
                    title, body, isRead: false, isSystem: true, recipientId: userId,referenceId,
                    referenceModel: ReferenceModelEnum.PURCHASE_PRODUCTS,type: NotificationTypeEnum.PURCHASE,
                }},
            }));
            await this.notificationRepository.bulkWrite(notificationsDocs, { ordered: false });
            this.realTimeGetway.sendToPermission(permission, 'new_notification', {
                title,body,referenceId,referenceModel,type,createdAt: new Date(),
            });
            this.realTimeGetway.sendToPermission(permission, eventName, payload);
            const fcmTokens = await this.fcmRedisService.getFCMsMulti(userIds)
            if (fcmTokens.length > 0) {
                await this.fcmService.sendNotifications({tokens: fcmTokens,data: { title, body }});
            }  
        }
        return
      } catch (error: any) {
          this.logger.error(`Error processing purchase notification [${eventName}]:`, error);
      }
    }

    @OnEvent('purchase.created', { async: true })
    async handlePurchaseCreated(data: IPurchaseEventPayload) {
        await this.dashboardNotification({permission: PermissionEnum.PURCHASE_PRODUCT_ADD,
            title: 'New Purchase Order 📝', type : NotificationTypeEnum.PURCHASE , referenceModel : ReferenceModelEnum.PURCHASE_PRODUCTS,
            body: `A new purchase order was created for supplier "${data.supplierNameSnapshot}" with total cost ${data.totalCost || 0}`,
            referenceId: data.purchaseProductId,eventName: 'purchase.created',payload: data,
            roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]
        });
    }

    @OnEvent('purchase.confirmed', { async: true })
    async handlePurchaseConfirmed(data: IPurchaseEventPayload) {
        await this.dashboardNotification({
            permission: PermissionEnum.PURCHASE_PRODUCT_UPDATE,
            title: 'Purchase Order Confirmed 🛒', type : NotificationTypeEnum.PURCHASE , referenceModel : ReferenceModelEnum.PURCHASE_PRODUCTS,
            body: `Purchase order for supplier "${data.supplierNameSnapshot}" has been confirmed and is now processing.`,
            referenceId: data.purchaseProductId,eventName: 'purchase.confirmed',payload: data,
            roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]
        });
    }

    @OnEvent('purchase.received', { async: true })
    async handlePurchaseReceived(data: IPurchaseEventPayload) {
        const isFullyReceived = data.status === PurchaseProcessStatusEnum.RECEIVED;
        const title = isFullyReceived ? 'Shipment Fully Received 📦' : 'Partial Shipment Received ⏳';
        const body = `Goods from supplier "${data.supplierNameSnapshot}" have been ${isFullyReceived ? 'fully' : 'partially'} received successfully.`;
        await this.dashboardNotification({
            permission: PermissionEnum.PURCHASE_PRODUCT_UPDATE,title,body,
            referenceId: data.purchaseProductId,eventName: 'purchase.received',payload: data,
            type : NotificationTypeEnum.PURCHASE , referenceModel : ReferenceModelEnum.PURCHASE_PRODUCTS,
            roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]
        });
    }

    @OnEvent('purchase.updated', { async: true })
    async handlePurchaseUpdated(data: IPurchaseEventPayload) {
        await this.dashboardNotification({
            permission: PermissionEnum.PURCHASE_PRODUCT_UPDATE,
            title: 'Purchase Order Updated ✏️', type : NotificationTypeEnum.PURCHASE , referenceModel : ReferenceModelEnum.PURCHASE_PRODUCTS,
            body: `Purchase order details or quantities for supplier "${data.supplierNameSnapshot}" have been updated.`,
            referenceId: data.purchaseProductId,eventName: 'purchase.updated',payload: data,
            roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]
        });
    }

    @OnEvent('purchase.cancelled', { async: true })
    async handlePurchaseCancelled(data: IPurchaseEventPayload) {
        await this.dashboardNotification({
            permission: PermissionEnum.PURCHASE_PRODUCT_UPDATE,
            title: 'Purchase Order Cancelled ❌',
            body: `Purchase order for supplier "${data.supplierNameSnapshot}" has been cancelled.`,
            referenceId: data.purchaseProductId, eventName: 'purchase.cancelled',payload: data,
            type : NotificationTypeEnum.PURCHASE , referenceModel : ReferenceModelEnum.PURCHASE_PRODUCTS,
            roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]
        });
    }

//======================== Order ====================================

    @OnEvent('order.created')
    async handleOrderCreated(payload: {
        orderId: Types.ObjectId, orderNumber: string,
        userId: Types.ObjectId, totalAmount: number,
        currency: SharedCurrencyEnum, paymentMethod: PaymentMethodEnum
    }) {
         // 1. إشعار للـ Dashboard بوجود طلب جديد في النظام
        await this.dashboardNotification({
            permission: PermissionEnum.ORDER_CHECKOUT,
            title: 'New Order 🛍️',
            body: `A new order #${payload.orderNumber} has been placed for ${payload.totalAmount} ${payload.currency} (${payload.paymentMethod}).`,
            referenceId: payload.orderId, eventName: 'order_created_event',referenceModel :ReferenceModelEnum.ORDER,
            payload: { ...payload, orderId: payload.orderId,userId: payload.userId},
            roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR],type :NotificationTypeEnum.ORDER
        });
        // 2. إشعار للعميل باستلام الطلب أولياً
        await this.dashboardNotification({
            title: 'Order Created Successfully 🛒',
            body: `Your cart has been checked out and order #${payload.orderNumber} for ${payload.totalAmount} ${payload.currency} has been placed.`,
            referenceId: payload.userId, eventName: 'order_created_event',permission:PermissionEnum.ORDER_CHECKOUT,
            payload: {...payload,orderId: payload.orderId,userId: payload.userId},referenceModel:ReferenceModelEnum.ORDER,
            roles : [RoleEnum.USER] , recipientId : payload.userId ,type:NotificationTypeEnum.ORDER
        });
    }
    @OnEvent('order.checkout_cash')
    async handleOrderCheckoutCash(payload: {
        orderId: Types.ObjectId,  orderNumber: string, userId: Types.ObjectId, 
        totalAmount: number, currency: CurrencyEnum, governorate: governorateEnum, itemsCount: number, 
    }) {
        // 1. إشعار للـ Dashboard للطلبات الكاش المفتوحة (تنبيه بوجود طلب يحتاج مراجعة وتأكيد)
        await this.dashboardNotification({
            permission: PermissionEnum.ORDER_CHECKOUT, 
            title: 'New Cash Order Pending Confirmation 💵',
            body: `New Cash Order #${payload.orderNumber} - Governorate: ${payload.governorate} (${payload.itemsCount} items) - Total: ${payload.totalAmount} ${payload.currency}`,
            referenceId: payload.orderId, eventName: 'order_checkout_cash_event', referenceModel :ReferenceModelEnum.ORDER,
            payload,roles:[RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR],type : NotificationTypeEnum.ORDER
        });
        // 2. إشعار للعميل للتأكيد على طريقة الدفع عند الاستلام
        await this.dashboardNotification({
            recipientId: payload.userId,
            title: 'Your Cash-on-Delivery Order is Under Review 📝',
            body: `Thank you! Your order #${payload.orderNumber} has been received and we will contact you shortly to confirm shipping to ${payload.governorate}.`,
            referenceId: payload.orderId, eventName: 'order_checkout_cash_event', payload,permission:PermissionEnum.ORDER_CHECKOUT,
            referenceModel:ReferenceModelEnum.ORDER,roles:[RoleEnum.USER],type:NotificationTypeEnum.ORDER
        });
    }
    @OnEvent('order.confirmed')
    async handleOrderConfirmed(payload: {
        orderId: Types.ObjectId , orderNumber: string, userId: Types.ObjectId,
        totalAmount: number, currency: SharedCurrencyEnum
    }) {
        // Notify Dashboard / Admins
        await this.dashboardNotification({
            permission: PermissionEnum.ORDER_CONFIRM,title: 'New Order Confirmed 📦',
            body: `Order #${payload.orderNumber} for ${payload.totalAmount} ${payload.currency} has been confirmed.`,
            referenceId: payload.orderId,referenceModel:ReferenceModelEnum.ORDER,
            roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR],type : NotificationTypeEnum.ORDER,
            eventName: 'order_confirmed_event', payload,
        });
        // Notify User
        await this.dashboardNotification({
            recipientId: payload.userId,title: 'Order Confirmed! 🎉',
            body: `Your order #${payload.orderNumber} is now being prepared.`,
            referenceId: payload.orderId, type : NotificationTypeEnum.ORDER,
            roles:[RoleEnum.USER],referenceModel : ReferenceModelEnum.ORDER,
            eventName: 'order_status_updated',permission : PermissionEnum.ORDER_VIEW,payload,
        });
    }

    @OnEvent('order.paid')
    async handleOrderPaid(payload: {
        orderId: Types.ObjectId; orderNumber: string; userId: Types.ObjectId;
        totalAmount: number;currency: SharedCurrencyEnum; paymentMethod: PaymentMethodEnum;
    }) {
        // Notify Dashboard
        await this.dashboardNotification({
            permission: PermissionEnum.ORDER_UPDATE,title: 'Payment Received Successfully 💳',
            body: `Payment of ${payload.totalAmount} ${payload.currency} received for order #${payload.orderNumber}.`,
            referenceId: payload.orderId,roles:[RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR],
            eventName: 'order_paid_event',referenceModel:ReferenceModelEnum.ORDER,type : NotificationTypeEnum.ORDER,
            payload,
        });
        // Notify User
        await this.dashboardNotification({
            recipientId: payload.userId,title: 'Payment Confirmed 💳',
            body: `Thank you! Payment for order #${payload.orderNumber} has been successfully confirmed.`,
            referenceId: payload.orderId, type : NotificationTypeEnum.ORDER,
            roles:[RoleEnum.USER],referenceModel : ReferenceModelEnum.ORDER,
            eventName: 'order_payment_success',permission:PermissionEnum.ORDER_VIEW,payload,
        });
    }

    @OnEvent('order.shipped')
    async handleOrderShipped(payload: {
        orderId: Types.ObjectId, orderNumber: string, userId: Types.ObjectId, shippingAddress: Address,
    }) {
    // Notify User
        await this.dashboardNotification({
            recipientId: payload.userId, title: 'Your Order is on Its Way! 🚚',
            body: `Order #${payload.orderNumber} has been shipped and is currently on its way to you.`,
            referenceId: payload.orderId, type : NotificationTypeEnum.ORDER,
            roles:[RoleEnum.USER],referenceModel : ReferenceModelEnum.ORDER,
            eventName: 'order_shipped_event',permission : PermissionEnum.ORDER_VIEW,payload,
        });
    }

    @OnEvent('order.delivered')
    async handleOrderDelivered(payload: {
        orderId: Types.ObjectId, orderNumber: string, 
        userId: Types.ObjectId, paymentMethod: PaymentMethodEnum, 
        deliveredAt: Date, 
    }) {
    // Notify Dashboard
        await this.dashboardNotification({
            permission: PermissionEnum.ORDER_UPDATE,title: 'Order Delivered ✅',
            body: `Order #${payload.orderNumber} has been successfully delivered to the customer.`,
            referenceId: payload.orderId,
            eventName: 'order_delivered_event',roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR],
            payload,referenceModel : ReferenceModelEnum.ORDER , type : NotificationTypeEnum.ORDER
        });

    // Notify User
        await this.dashboardNotification({
            recipientId: payload.userId,title: 'Order Delivered Successfully 🎁',
            body: `We hope you love your purchase! Order #${payload.orderNumber} has been delivered.`,
            referenceId: payload.orderId, type : NotificationTypeEnum.ORDER,
            roles:[RoleEnum.USER],referenceModel : ReferenceModelEnum.ORDER,
            eventName: 'order_delivered_event',permission : PermissionEnum.ORDER_VIEW,
            payload,
        });
    }

    @OnEvent('order.refund_requested')
    async handleRefundRequested(payload: {
        orderId: Types.ObjectId, orderNumber: string, recipientId: Types.ObjectId, items: any[],
        reason: RefundResoneEnum, refundReasonOther?: string,
    }) {
    // Notify Dashboard (Admins)
        await this.dashboardNotification({
            permission: PermissionEnum.ORDER_REFUND_REQUEST,title: 'New Refund Request ⚠️',
            body: `Customer requested a refund for order #${payload.orderNumber}. Reason: ${payload.reason}`,
            referenceId: payload.orderId,referenceModel:ReferenceModelEnum.ORDER,
            eventName: 'refund_requested_event', roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR , RoleEnum.USER],
            payload,type : NotificationTypeEnum.ORDER,recipientId : payload.recipientId
        });
    }

    @OnEvent('order.refund_rejected')
    async handleRefundRejected(payload: {
        orderId: Types.ObjectId;orderNumber: string;userId: Types.ObjectId;
        rejectionReason: RefundResoneEnum;rejectReasonOther?: string;
    }) {
    // Notify User
        await this.dashboardNotification({
            recipientId: payload.userId,title: 'Refund Request Update ❌',
            body: `Unfortunately, your refund request for order #${payload.orderNumber} was rejected. Reason: ${payload.rejectionReason}`,
            referenceId: payload.orderId, type : NotificationTypeEnum.ORDER,
            roles:[RoleEnum.USER],referenceModel : ReferenceModelEnum.ORDER,
            eventName: 'refund_rejected_event',permission : PermissionEnum.ORDER_VIEW , payload,
        });
    }

    @OnEvent('order.refunded')
    async handleOrderRefunded(payload: {
        orderId: Types.ObjectId; orderNumber: string;
        userId: Types.ObjectId; refundedAmount: number;
        currency: SharedCurrencyEnum; refundType: RefundTypeEnum;
        paymentMethod: PaymentMethodEnum;
    }) {
    // Notify Dashboard
        await this.dashboardNotification({
        permission: PermissionEnum.ORDER_REFUND,title: 'Refund Processed 💰',
        body: `A refund of ${payload.refundedAmount} ${payload.currency} was processed for order #${payload.orderNumber}.`,
        referenceId: payload.orderId,referenceModel:ReferenceModelEnum.ORDER,
        eventName: 'order_refunded_event',roles:[RoleEnum.ADMIN , RoleEnum.SUPERADMIN],payload,type :NotificationTypeEnum.ORDER
        });
    // Notify User
        await this.dashboardNotification({
        recipientId: payload.userId,title: 'Refund Issued Successfully 💰',
        body: `A refund of ${payload.refundedAmount} ${payload.currency} for order #${payload.orderNumber} has been successfully processed.`,
        referenceId: payload.orderId, type : NotificationTypeEnum.ORDER,
        roles:[RoleEnum.USER],referenceModel : ReferenceModelEnum.ORDER,permission:PermissionEnum.ORDER_VIEW,
        eventName: 'order_refunded_event',
        payload,
        });
    }
//======================== Review ====================================
    @OnEvent('review.created')
    async handleReviewCreated(payload: {
        reviewId: Types.ObjectId, productId: Types.ObjectId,
        variantId: Types.ObjectId, userId: Types.ObjectId,
        rating: number, comment: string, sku: string
    }) {
        // 1. Notify Dashboard / Admins about new product feedback
        await this.dashboardNotification({
            permission: PermissionEnum.REVIEW_VIEW,title: 'New Product Review ⭐️',
            body: `A new ${payload.rating}-star review was posted for SKU: ${payload.sku}.`,
            referenceId: payload.reviewId, eventName: 'review_created_event', referenceModel: ReferenceModelEnum.REVIEW,
            payload, roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR], type: NotificationTypeEnum.REVIEW
        });

        // 2. Notify User thanking them for the feedback
        await this.dashboardNotification({
            recipientId: payload.userId,title: 'Thank You for Your Feedback! 🙏',
            body: `Your ${payload.rating}-star review for product (SKU: ${payload.sku}) has been published. Thank you for helping our community!`,
            referenceId: payload.reviewId, eventName: 'review_created_event', permission: PermissionEnum.REVIEW_VIEW,
            payload, referenceModel: ReferenceModelEnum.REVIEW, roles: [RoleEnum.USER], type: NotificationTypeEnum.REVIEW
        });
    }

    @OnEvent('review.flagged')
    async handleReviewFlagged(payload: {
        reviewId: Types.ObjectId, productId: Types.ObjectId,
        variantId: Types.ObjectId, userId: Types.ObjectId,
        rating: number, comment: string, sku: string
    }) {
        // 1. Alert Admins to review/moderate the flagged review
        await this.dashboardNotification({
            permission: PermissionEnum.REPORTS_VIEW,
            title: 'Review Flagged for Moderation ⚠️',
            body: `A review for SKU: ${payload.sku} was flagged for inappropriate language and requires admin approval.`,
            referenceId: payload.reviewId, eventName: 'review_flagged_event', referenceModel: ReferenceModelEnum.REVIEW,
            payload, roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR], type: NotificationTypeEnum.REVIEW
        });

        // 2. Inform User that their review is under review
        await this.dashboardNotification({
            recipientId: payload.userId,
            title: 'Review Submitted for Moderation ⏳',
            body: `Your review for product (SKU: ${payload.sku}) has been received and is currently under review by our moderation team.`,
            referenceId: payload.reviewId, eventName: 'review_flagged_event', permission: PermissionEnum.REVIEW_VIEW,
            payload, referenceModel: ReferenceModelEnum.REVIEW, roles: [RoleEnum.USER], type: NotificationTypeEnum.REVIEW
        });
    }

    @OnEvent('review.approved')
    async handleReviewApproved(payload: {
        reviewId: Types.ObjectId, userId: Types.ObjectId, sku: string
    }) {
        // Notify User that their held review is now active
        await this.dashboardNotification({
            recipientId: payload.userId,
            title: 'Your Review Has Been Approved! ✅',
            body: `Good news! Your review for product (SKU: ${payload.sku}) has been approved and is now live on the store.`,
            referenceId: payload.reviewId, eventName: 'review_approved_event', permission: PermissionEnum.REVIEW_VIEW,
            payload, referenceModel: ReferenceModelEnum.REVIEW, roles: [RoleEnum.USER], type: NotificationTypeEnum.REVIEW
        });
    }

    @OnEvent('review.rejected')
    async handleReviewRejected(payload: {
        reviewId: Types.ObjectId, userId: Types.ObjectId, sku: string, reason?: string
    }) {
        // Notify User about rejection due to community guidelines
        await this.dashboardNotification({
            recipientId: payload.userId,
            title: 'Review Moderation Update ❌',
            body: `Your review for product (SKU: ${payload.sku}) was not published as it does not comply with our community guidelines.`,
            referenceId: payload.reviewId, eventName: 'review_rejected_event', permission: PermissionEnum.REVIEW_VIEW,
            payload, referenceModel: ReferenceModelEnum.REVIEW, roles: [RoleEnum.USER], type: NotificationTypeEnum.REVIEW
        });
    }
//======================== Brand ====================================
    @OnEvent('brand.created')
    async handleBrandCreated(payload: {
        brandId: Types.ObjectId, name: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.BRAND_CREATE,
            title: 'New Brand Created 🏷️',
            body: `Brand "${payload.name}" has been created successfully.`,
            referenceId: payload.brandId,
            eventName: 'brand_created_event',
            referenceModel: ReferenceModelEnum.BRAND,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('brand.updated')
    async handleBrandUpdated(payload: {
        brandId: Types.ObjectId, name: string, oldName: string, actorId: Types.ObjectId, logoChanged: boolean
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.BRAND_UPDATE,
            title: 'Brand Updated ✏️',
            body: `Brand "${payload.oldName}" has been updated${payload.name !== payload.oldName ? ` to "${payload.name}"` : ''}.`,
            referenceId: payload.brandId,
            eventName: 'brand_updated_event',
            referenceModel: ReferenceModelEnum.BRAND,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('brand.soft_deleted')
    async handleBrandSoftDeleted(payload: {
        brandId: Types.ObjectId, name: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.BRAND_UPDATE,
            title: 'Brand Archived 📦',
            body: `Brand "${payload.name}" has been moved to archives.`,
            referenceId: payload.brandId,
            eventName: 'brand_soft_deleted_event',
            referenceModel: ReferenceModelEnum.BRAND,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('brand.restored')
    async handleBrandRestored(payload: {
        brandId: Types.ObjectId, name: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.BRAND_UPDATE,
            title: 'Brand Restored 🔄',
            body: `Brand "${payload.name}" has been restored from archives.`,
            referenceId: payload.brandId,
            eventName: 'brand_restored_event',
            referenceModel: ReferenceModelEnum.BRAND,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('brand.deleted')
    async handleBrandDeleted(payload: {
        brandId: Types.ObjectId, name: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.BRAND_DELETE,
            title: 'Brand Permanently Deleted 🗑️',
            body: `Brand "${payload.name}" has been permanently removed from the system.`,
            referenceId: payload.brandId,
            eventName: 'brand_deleted_event',
            referenceModel: ReferenceModelEnum.BRAND,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }
//======================== Supplier Brand ====================================
    @OnEvent('brand-supplier.created')
    async handleBrandSupplierCreated(payload: {
        brandSupplierId: Types.ObjectId, brandName: string, supplierName: string,
        isPrimary: boolean, isActive: boolean, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.SUPPLIER_ADD,
            title: 'Supplier Linked to Brand 🔗',
            body: `Supplier "${payload.supplierName}" has been assigned to brand "${payload.brandName}"${payload.isPrimary ? ' as primary supplier' : ''}.`,
            referenceId: payload.brandSupplierId,
            eventName: 'brand_supplier_created_event',
            referenceModel: ReferenceModelEnum.BRAND_SUPPLIER,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('brand-supplier.updated')
    async handleBrandSupplierUpdated(payload: {
        brandSupplierId: Types.ObjectId, brandName: string, supplierName: string,
        isPrimary: boolean, isActive: boolean, changedFields: string[], actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.BRAND_SUPPLIER_UPDATE,
            title: 'Brand-Supplier Relation Updated ✏️',
            body: `Relation between supplier "${payload.supplierName}" and brand "${payload.brandName}" was updated.`,
            referenceId: payload.brandSupplierId,
            eventName: 'brand_supplier_updated_event',
            referenceModel: ReferenceModelEnum.BRAND_SUPPLIER,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('brand-supplier.removed')
    async handleBrandSupplierRemoved(payload: {
        brandSupplierId: Types.ObjectId, brandName: string, supplierName: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.BRAND_SUPPLIER_DELETE,
            title: 'Supplier Unlinked from Brand 🗑️',
            body: `Supplier "${payload.supplierName}" was removed from brand "${payload.brandName}".`,
            referenceId: payload.brandSupplierId,
            eventName: 'brand_supplier_removed_event',
            referenceModel: ReferenceModelEnum.BRAND_SUPPLIER,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR],
            type: NotificationTypeEnum.SYSTEM,
        });
    }
//======================== Category ====================================

    @OnEvent('category.created')
    async handleCategoryCreated(payload: {
        categoryId: Types.ObjectId, name: string, isSubCategory: boolean, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.CATEGORY_UPDATE,
            title: payload.isSubCategory ? 'New Subcategory Created 📂' : 'New Main Category Created 📁',
            body: `${payload.isSubCategory ? 'Subcategory' : 'Category'} "${payload.name}" has been created successfully.`,
            referenceId: payload.categoryId,
            eventName: 'category_created_event',
            referenceModel: ReferenceModelEnum.CATEGORY,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('category.updated')
    async handleCategoryUpdated(payload: {
        categoryId: Types.ObjectId, name: string, oldName: string, parentChanged: boolean, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.CATEGORY_UPDATE,
            title: 'Category Updated ✏️',
            body: `Category "${payload.oldName}" was updated${payload.name !== payload.oldName ? ` to "${payload.name}"` : ''}.`,
            referenceId: payload.categoryId,
            eventName: 'category_updated_event',
            referenceModel: ReferenceModelEnum.CATEGORY,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('category.soft_deleted')
    async handleCategorySoftDeleted(payload: {
        categoryId: Types.ObjectId, name: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.CATEGORY_UPDATE,
            title: 'Category Archived 📦',
            body: `Category "${payload.name}" and its subcategories were moved to archives.`,
            referenceId: payload.categoryId,
            eventName: 'category_soft_deleted_event',
            referenceModel: ReferenceModelEnum.CATEGORY,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('category.restored')
    async handleCategoryRestored(payload: {
        categoryId: Types.ObjectId, name: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.CATEGORY_UPDATE,
            title: 'Category Restored 🔄',
            body: `Category "${payload.name}" and its subcategories were restored.`,
            referenceId: payload.categoryId,
            eventName: 'category_restored_event',
            referenceModel: ReferenceModelEnum.CATEGORY,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('category.deleted')
    async handleCategoryDeleted(payload: {
        categoryId: Types.ObjectId, name: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.CATEGORY_DELETE,
            title: 'Category Permanently Deleted 🗑️',
            body: `Category "${payload.name}" and all associated child categories were permanently removed.`,
            referenceId: payload.categoryId,eventName: 'category_deleted_event',
            referenceModel: ReferenceModelEnum.CATEGORY,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }
//======================== Coupon ====================================
    @OnEvent('coupon.created')
    async handleCouponCreated(payload: {
        couponId: Types.ObjectId, code: string, discount: string,
        expiresAt: Date, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.COUPON_CREATE,
            title: 'New Coupon Created 🎟️',
            body: `Coupon "${payload.code}" with discount (${payload.discount}) has been activated until ${new Date(payload.expiresAt).toLocaleDateString()}.`,
            referenceId: payload.couponId,
            eventName: 'coupon_created_event',
            referenceModel: ReferenceModelEnum.COUPON,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('coupon.updated')
    async handleCouponUpdated(payload: {
        couponId: Types.ObjectId, code: string, changedFields: string[], actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.COUPON_UPDATE,
            title: 'Coupon Settings Updated ✏️',
            body: `Coupon "${payload.code}" parameters were updated (${payload.changedFields.join(', ')}).`,
            referenceId: payload.couponId,
            eventName: 'coupon_updated_event',
            referenceModel: ReferenceModelEnum.COUPON,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('coupon.disabled')
    async handleCouponDisabled(payload: {
        couponId: Types.ObjectId, code: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.COUPON_UPDATE,
            title: 'Coupon Deactivated 🚫',
            body: `Coupon "${payload.code}" has been manually disabled and is no longer valid for checkouts.`,
            referenceId: payload.couponId,
            eventName: 'coupon_disabled_event',
            referenceModel: ReferenceModelEnum.COUPON,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }
//======================== Inventory ====================================

    @OnEvent('inventory.created')
    async handleInventoryCreated(payload: {
        inventoryId: Types.ObjectId, sku: string, productTitle: string,
        warehouseName: string, quantity: number, lowStockThreshold: number, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.INVENTORY_ADD,
            title: 'Inventory Stock Added 📦',
            body: `SKU "${payload.sku}" (${payload.productTitle}) was added to warehouse "${payload.warehouseName}" with initial stock of ${payload.quantity}.`,
            referenceId: payload.inventoryId,
            eventName: 'inventory_created_event',
            referenceModel: ReferenceModelEnum.INVENTORY,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('inventory.updated')
    async handleInventoryUpdated(payload: {
        inventoryId: Types.ObjectId, sku: string, productTitle: string,
        oldQuantity: number, newQuantity: number, availableQuantity: number, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.INVENTORY_UPDATE,
            title: 'Inventory Stock Updated 🔄',
            body: `Stock for SKU "${payload.sku}" updated from ${payload.oldQuantity} to ${payload.newQuantity} (Available: ${payload.availableQuantity}).`,
            referenceId: payload.inventoryId,
            eventName: 'inventory_updated_event',
            referenceModel: ReferenceModelEnum.INVENTORY,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('inventory.low_stock')
    async handleInventoryLowStock(payload: {
        inventoryId: Types.ObjectId, sku: string, productTitle: string,
        availableQuantity: number, lowStockThreshold: number, warehouseId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.INVENTORY_UPDATE,
            title: '⚠️ Low Stock Warning',
            body: `SKU "${payload.sku}" (${payload.productTitle}) has reached critical stock level! Available: ${payload.availableQuantity} (Threshold: ${payload.lowStockThreshold}).`,
            referenceId: payload.inventoryId,
            eventName: 'inventory_low_stock_event',
            referenceModel: ReferenceModelEnum.INVENTORY,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.STOCK_ALERT,
        });
    }

    @OnEvent('inventory.removed')
    async handleInventoryRemoved(payload: {
        inventoryId: Types.ObjectId, sku: string, productTitle: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.INVENTORY_DELETE,
            title: 'Inventory Item Removed 🗑️',
            body: `SKU "${payload.sku}" (${payload.productTitle}) was completely removed from warehouse inventory.`,
            referenceId: payload.inventoryId,
            eventName: 'inventory_removed_event',
            referenceModel: ReferenceModelEnum.INVENTORY,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }
//======================== Product ====================================
    @OnEvent('product.created')
    async handleProductCreated(payload: {
        productId: Types.ObjectId, title: string, defaultSku: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_CREATE,
            title: 'New Product Draft Created 🛍️',
            body: `Product "${payload.title}" (SKU: ${payload.defaultSku}) was created as a draft.`,
            referenceId: payload.productId,
            eventName: 'product_created_event',
            referenceModel: ReferenceModelEnum.PRODUCT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product.updated')
    async handleProductUpdated(payload: {
        productId: Types.ObjectId, title: string, changedFields: string[], actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_UPDATE,
            title: 'Product Updated ✏️',
            body: `Product "${payload.title}" details were updated (${payload.changedFields.join(', ')}).`,
            referenceId: payload.productId,
            eventName: 'product_updated_event',
            referenceModel: ReferenceModelEnum.PRODUCT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product.published')
    async handleProductPublished(payload: {
        productId: Types.ObjectId, title: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_UPDATE,
            title: 'Product Published Live 🚀',
            body: `Product "${payload.title}" is now published and active on the storefront.`,
            referenceId: payload.productId,
            eventName: 'product_published_event',
            referenceModel: ReferenceModelEnum.PRODUCT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product.unpublished')
    async handleProductUnpublished(payload: {
        productId: Types.ObjectId, title: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_UPDATE,
            title: 'Product Hidden from Store 👁️‍🗨️',
            body: `Product "${payload.title}" was unpublished and is no longer visible to customers.`,
            referenceId: payload.productId,
            eventName: 'product_unpublished_event',
            referenceModel: ReferenceModelEnum.PRODUCT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product.archived')
    async handleProductArchived(payload: {
        productId: Types.ObjectId, title: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_UPDATE,
            title: 'Product Moved to Archive 📦',
            body: `Product "${payload.title}" and its variants were moved to the archive.`,
            referenceId: payload.productId,
            eventName: 'product_archived_event',
            referenceModel: ReferenceModelEnum.PRODUCT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product.restored')
    async handleProductRestored(payload: {
        productId: Types.ObjectId, title: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_UPDATE,
            title: 'Product Restored 🔄',
            body: `Product "${payload.title}" was restored from the archive.`,
            referenceId: payload.productId,
            eventName: 'product_restored_event',
            referenceModel: ReferenceModelEnum.PRODUCT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product.deleted')
    async handleProductDeleted(payload: {
        productId: Types.ObjectId, title: string, variantsDeleted: number, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_DELETE,
            title: 'Product Permanently Deleted ⚠️',
            body: `Product "${payload.title}" and ${payload.variantsDeleted} associated variants were permanently deleted.`,
            referenceId: payload.productId,
            eventName: 'product_deleted_event',
            referenceModel: ReferenceModelEnum.PRODUCT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.ALERT,
        });
    }
//======================== Product Supplier ====================================
    @OnEvent('product-supplier.created')
    async handleProductSupplierCreated(payload: {
        productSupplierId: Types.ObjectId,
        supplierId: Types.ObjectId,
        productVariantId: Types.ObjectId,
        sku: string,
        costPrice: number,
        currency: SharedCurrencyEnum,
        isPrimary: boolean,
        leadTimeDays?: number,
        actorId: Types.ObjectId
    }) {
        const primaryTag = payload.isPrimary ? ' [PRIMARY]' : '';
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_SUPPLIER_ADD,
            title: 'New Supplier Sourced 🚚',
            body: `Supplier linked to variant (SKU: ${payload.sku}) with cost ${payload.costPrice} ${payload.currency}${primaryTag}.`,
            referenceId: payload.productSupplierId,
            eventName: 'product_supplier_created_event',
            referenceModel: ReferenceModelEnum.PRODUCT_SUPPLIER,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product-supplier.updated')
    async handleProductSupplierUpdated(payload: {
        productSupplierId: Types.ObjectId,
        supplierId: Types.ObjectId,
        productVariantId: Types.ObjectId,
        sku: string,
        costPrice?: number,
        isPrimary?: boolean,
        changedFields: string[],
        actorId: Types.ObjectId
    }) {
        const costUpdateInfo = payload.costPrice !== undefined ? ` New Cost: ${payload.costPrice}.` : '';
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_SUPPLIER_UPDATE,
            title: 'Supplier Supply Terms Updated 📋',
            body: `Supplier details for SKU "${payload.sku}" updated (${payload.changedFields.join(', ')}).${costUpdateInfo}`,
            referenceId: payload.productSupplierId,
            eventName: 'product_supplier_updated_event',
            referenceModel: ReferenceModelEnum.PRODUCT_SUPPLIER,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product-supplier.removed')
    async handleProductSupplierRemoved(payload: {
        productSupplierId: Types.ObjectId,
        supplierId: Types.ObjectId,
        productVariantId: Types.ObjectId,
        sku: string,
        deletedCostPrice: number,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_SUPPLIER_DELETE,
            title: 'Supplier Unlinked from Product ⚠️',
            body: `Supplier link removed for variant (SKU: ${payload.sku}). Check remaining supplier sourcing options.`,
            referenceId: payload.productSupplierId,
            eventName: 'product_supplier_removed_event',
            referenceModel: ReferenceModelEnum.PRODUCT_SUPPLIER,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.ALERT,
        });
    }
//======================== Product Variant ====================================
    @OnEvent('product-variant.created')
    async handleVariantCreated(payload: {
        variantId: Types.ObjectId, productId: Types.ObjectId, sku: string, price: number, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_CREATE,
            title: 'New Variant Created 🏷️',
            body: `New product variant (SKU: ${payload.sku}) was created with price ${payload.price}.`,
            referenceId: payload.variantId,
            eventName: 'product_variant_created_event',
            referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product-variant.updated')
    async handleVariantUpdated(payload: {
        variantId: Types.ObjectId, sku: string, changedFields: string[], actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_UPDATE,
            title: 'Variant Updated 🎨',
            body: `Variant (SKU: ${payload.sku}) details updated (${payload.changedFields.join(', ')}).`,
            referenceId: payload.variantId,
            eventName: 'product_variant_updated_event',
            referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product-variant.published')
    async handleVariantPublished(payload: {
        variantId: Types.ObjectId, sku: string, productId: Types.ObjectId, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_UPDATE,
            title: 'Variant Published Live 🚀',
            body: `Variant (SKU: ${payload.sku}) is now active and available for customer orders.`,
            referenceId: payload.variantId,
            eventName: 'product_variant_published_event',
            referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product-variant.unpublished')
    async handleVariantUnpublished(payload: {
        variantId: Types.ObjectId, sku: string, productId: Types.ObjectId, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_UPDATE,
            title: 'Variant Unpublished 🙈',
            body: `Variant (SKU: ${payload.sku}) was unpublished and hidden from storefront.`,
            referenceId: payload.variantId,
            eventName: 'product_variant_unpublished_event',
            referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product-variant.archived')
    async handleVariantArchived(payload: {
        variantId: Types.ObjectId, sku: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_UPDATE,
            title: 'Variant Archived 📦',
            body: `Variant (SKU: ${payload.sku}) was moved to archive.`,
            referenceId: payload.variantId,
            eventName: 'product_variant_archived_event',
            referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product-variant.restored')
    async handleVariantRestored(payload: {
        variantId: Types.ObjectId, sku: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_UPDATE,
            title: 'Variant Restored 🔄',
            body: `Variant (SKU: ${payload.sku}) was restored from archive.`,
            referenceId: payload.variantId,
            eventName: 'product_variant_restored_event',
            referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('product-variant.deleted')
    async handleVariantDeleted(payload: {
        variantId: Types.ObjectId, sku: string, actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.PRODUCT_DELETE,
            title: 'Variant Permanently Deleted ⚠️',
            body: `Variant (SKU: ${payload.sku}) and its S3 media assets were permanently deleted.`,
            referenceId: payload.variantId,
            eventName: 'product_variant_deleted_event',
            referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.ALERT,
        });
    }
//======================== Settings ====================================
    @OnEvent('settings.base_currency.changed')
    async handleBaseCurrencyChanged(payload: {
        settingsId: Types.ObjectId,
        baseCurrencyBefore: string,
        baseCurrencyAfter: string,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.SETTINGS_UPDATE,
            title: 'System Base Currency Changed 🚨',
            body: `Base system currency was changed from ${payload.baseCurrencyBefore} to ${payload.baseCurrencyAfter}. All future transactions will use this currency.`,
            referenceId: payload.settingsId,
            eventName: 'settings_base_currency_changed_event',
            referenceModel: ReferenceModelEnum.SETTINGS,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.ALERT,
        });
    }

    @OnEvent('settings.return_policy.updated')
    async handleReturnPolicyUpdated(payload: {
        settingsId: Types.ObjectId,
        returnPolicyDaysBefore: number,
        returnPolicyDaysAfter: number,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.SETTINGS_UPDATE,
            title: 'Return Policy Updated 🔄',
            body: `Return policy period updated from ${payload.returnPolicyDaysBefore} days to ${payload.returnPolicyDaysAfter} days.`,
            referenceId: payload.settingsId,
            eventName: 'settings_return_policy_updated_event',
            referenceModel: ReferenceModelEnum.SETTINGS,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('settings.currency.added')
    async handleCurrencyAdded(payload: {
        settingsId: Types.ObjectId,
        addedCurrencyCode: string,
        exchangeRate: number,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.SETTINGS_UPDATE,
            title: 'New Currency Supported 💱',
            body: `Currency "${payload.addedCurrencyCode}" was added with an initial exchange rate of ${payload.exchangeRate}.`,
            referenceId: payload.settingsId,
            eventName: 'settings_currency_added_event',
            referenceModel: ReferenceModelEnum.SETTINGS,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('settings.currency.removed')
    async handleCurrencyRemoved(payload: {
        settingsId: Types.ObjectId,
        removedCurrencyCode: string,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.SETTINGS_UPDATE,
            title: 'Currency Removed 🚫',
            body: `Currency "${payload.removedCurrencyCode}" has been removed from supported currencies.`,
            referenceId: payload.settingsId,
            eventName: 'settings_currency_removed_event',
            referenceModel: ReferenceModelEnum.SETTINGS,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('settings.branding.updated')
    async handleBrandingUpdated(payload: {
        settingsId: Types.ObjectId,
        projectName?: string,
        logoUrl?: string,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.SETTINGS_UPDATE,
            title: 'System Identity Updated 🎨',
            body: `System branding details (project name or logo) were updated successfully.`,
            referenceId: payload.settingsId,
            eventName: 'settings_branding_updated_event',
            referenceModel: ReferenceModelEnum.SETTINGS,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }
//======================== Shipping Zone ====================================

    @OnEvent('shipping.zone.created')
    async handleShippingZoneCreated(payload: {
        shippingZoneId: Types.ObjectId,
        governorate: string,
        price: number,
        mainCost: number,
        estimatedDays: number,
        isActive: boolean,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.SHIPPING_ZONE_CREATE,
            title: 'New Shipping Zone Added 🚚',
            body: `Shipping support added for "${payload.governorate}" (Fee: ${payload.price}, Est. Delivery: ${payload.estimatedDays} days).`,
            referenceId: payload.shippingZoneId,
            eventName: 'shipping_zone_created_event',
            referenceModel: ReferenceModelEnum.SHIPPING_ZONE,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('shipping.zone.updated')
    async handleShippingZoneUpdated(payload: {
        shippingZoneId: Types.ObjectId,
        governorate: string,
        price: number,
        mainCost: number,
        estimatedDays: number,
        isActive: boolean,
        changedFields: string[],
        actorId: Types.ObjectId
    }) {
        const activeStatusText = payload.changedFields.includes('isActive') 
        ? ` Status is now ${payload.isActive ? 'Active' : 'Inactive'}.` 
        : '';
        await this.dashboardNotification({
            permission: PermissionEnum.SHIPPING_ZONE_UPDATE,
            title: 'Shipping Zone Policy Updated 🏷️',
            body: `Shipping terms for "${payload.governorate}" updated (${payload.changedFields.join(', ')}). Fee: ${payload.price}, ETA: ${payload.estimatedDays} days.${activeStatusText}`,
            referenceId: payload.shippingZoneId,
            eventName: 'shipping_zone_updated_event',
            referenceModel: ReferenceModelEnum.SHIPPING_ZONE,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('shipping.zone.removed')
    async handleShippingZoneRemoved(payload: {
        shippingZoneId: Types.ObjectId,
        governorate: string,
        deletedPrice: number,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.SHIPPING_ZONE_DELETE,
            title: 'Shipping Zone Deleted ⚠️',
            body: `Shipping zone for governorate "${payload.governorate}" was deleted. Standard checkout delivery to this area is disabled.`,
            referenceId: payload.shippingZoneId,
            eventName: 'shipping_zone_removed_event',
            referenceModel: ReferenceModelEnum.SHIPPING_ZONE,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.ALERT,
        });
    }
//======================== Stock Adjustment ====================================
    @OnEvent('stock.adjustment.created')
    async handleStockAdjustmentCreated(payload: {
        stockAdjustmentId: Types.ObjectId,
        warehouseId: Types.ObjectId,
        warehouseName: string,
        itemsCount: number,
        notes?: string,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.STOCK_ADJUSTMENT_CREATE,
            title: 'New Stock Adjustment Request 📋',
            body: `A new stock adjustment request with ${payload.itemsCount} items has been submitted for warehouse "${payload.warehouseName}" and is awaiting approval.`,
            referenceId: payload.stockAdjustmentId,
            eventName: 'stock_adjustment_created_event',
            referenceModel: ReferenceModelEnum.STOCK_ADJUSTMENT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('stock.adjustment.updated')
    async handleStockAdjustmentUpdated(payload: {
        stockAdjustmentId: Types.ObjectId,
        warehouseId: Types.ObjectId,
        warehouseName: string,
        hasItemsChanged: boolean,
        hasWarehouseChanged: boolean,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.STOCK_ADJUSTMENT_UPDATE,
            title: 'Stock Adjustment Draft Updated ✏️',
            body: `Pending stock adjustment for "${payload.warehouseName}" was updated.`,
            referenceId: payload.stockAdjustmentId,
            eventName: 'stock_adjustment_updated_event',
            referenceModel: ReferenceModelEnum.STOCK_ADJUSTMENT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('stock.adjustment.approved')
    async handleStockAdjustmentApproved(payload: {
        stockAdjustmentId: Types.ObjectId,
        warehouseId: Types.ObjectId,
        warehouseName: string,
        totalLossAmount: number,
        totalGainAmount: number,
        currency: string,
        adjustmentsSummary: Array<{
            productVariantId: Types.ObjectId,
            sku: string,
            expected: number,
            counted: number,
            difference: number,
            status: string
        }>,
        approvedBy: string,
        actorId: Types.ObjectId
    }) {
        // Construct financial summary text
        let financialSummary = '';
        if (payload.totalLossAmount > 0) financialSummary += ` Loss: ${payload.totalLossAmount} ${payload.currency}.`;
        if (payload.totalGainAmount > 0) financialSummary += ` Gain: ${payload.totalGainAmount} ${payload.currency}.`;
        if (payload.totalLossAmount === 0 && payload.totalGainAmount === 0) financialSummary = ' No financial impact (Balanced).';

        await this.dashboardNotification({
            permission: PermissionEnum.STOCK_ADJUSTMENT_UPDATE,
            title: 'Stock Adjustment Approved 📊',
            body: `Stock adjustment for "${payload.warehouseName}" approved by ${payload.approvedBy}.${financialSummary} Inventory counts updated.`,
            referenceId: payload.stockAdjustmentId,
            eventName: 'stock_adjustment_approved_event',
            referenceModel: ReferenceModelEnum.STOCK_ADJUSTMENT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.ALERT,
        });
    }

    @OnEvent('stock.adjustment.rejected')
    async handleStockAdjustmentRejected(payload: {
        stockAdjustmentId: Types.ObjectId,
        warehouseId: Types.ObjectId,
        rejectedBy: string,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.STOCK_ADJUSTMENT_UPDATE,
            title: 'Stock Adjustment Rejected ❌',
            body: `Stock adjustment request was rejected by ${payload.rejectedBy}. Inventory levels remain unchanged.`,
            referenceId: payload.stockAdjustmentId,
            eventName: 'stock_adjustment_rejected_event',
            referenceModel: ReferenceModelEnum.STOCK_ADJUSTMENT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.ALERT,
        });
    }

    @OnEvent('stock.adjustment.removed')
    async handleStockAdjustmentRemoved(payload: {
        stockAdjustmentId: Types.ObjectId,
        warehouseId: Types.ObjectId,
        warehouseName: string,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.STOCK_ADJUSTMENT_DELETE,
            title: 'Stock Adjustment Record Removed 🗑️',
            body: `Stock adjustment record for "${payload.warehouseName}" has been deleted from the system.`,
            referenceId: payload.stockAdjustmentId,
            eventName: 'stock_adjustment_removed_event',
            referenceModel: ReferenceModelEnum.STOCK_ADJUSTMENT,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }
//======================== Financial Review ====================================
    @OnEvent('financial.review.created')
    async handleFinancialReviewCreated(payload: {
        financialReviewId: Types.ObjectId,
        category: FinancialCategoryEnum,
        source: FinancialSourceEnum,
        amount: number,
        currency: string,
        referenceId: Types.ObjectId,
        referenceModel: ReferenceModelEnum,
        warehouseId?: Types.ObjectId,
        orderNumber?: string,
        paymentMethod?: string,
        refundType?: string,
        refundReason?: string,
        stripeRefundId?: string,
        actorId?: Types.ObjectId
    }) {
        let title = 'Financial Ledger Updated 💰';
        let body = `A new financial record of ${payload.amount} ${payload.currency} was posted.`;
        let notificationType = NotificationTypeEnum.SYSTEM;

        switch (payload.category) {
            case FinancialCategoryEnum.REFUND:
                title = 'Order Refund Processed 🔄💸';
                body = `Refund (${payload.refundType || 'Standard'}) of ${payload.amount} ${payload.currency} issued for Order #${payload.orderNumber || ''}. Reason: ${payload.refundReason || 'Not specified'}.`;
                notificationType = NotificationTypeEnum.ALERT;
                break;

            case FinancialCategoryEnum.LOSS:
                title = 'Inventory Loss Recorded 📉';
                body = `Stock audit loss recorded: ${payload.amount} ${payload.currency}. Immediate finance & inventory review recommended.`;
                notificationType = NotificationTypeEnum.ALERT;
                break;

            case FinancialCategoryEnum.EXPENSE:
                title = 'Purchase Fulfillment Expense 📦';
                body = `Fulfillment expense of ${payload.amount} ${payload.currency} recorded for received goods.`;
                break;

            case FinancialCategoryEnum.REVENUE:
                if (payload.source === FinancialSourceEnum.ORDER) {
                    title = 'Order Revenue Collected 💵';
                    body = `Revenue of ${payload.amount} ${payload.currency} collected for Order #${payload.orderNumber || ''} via ${payload.paymentMethod || 'Payment Gateway'}.`;
                } else {
                    title = 'Inventory Surplus Recorded 📈';
                    body = `Stock audit surplus gain recorded: +${payload.amount} ${payload.currency}.`;
                }
                break;
        }

        await this.dashboardNotification({
            permission: PermissionEnum.FINANCIAL_MANAGE,
            title,body,referenceId: payload.financialReviewId,
            eventName: 'financial_review_created_event',
            referenceModel: ReferenceModelEnum.FINANCIAL_REVIEW,payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],type: notificationType,
        });
    }
//======================== Supplier ============================================
    @OnEvent('supplier.created')
    async handleSupplierCreated(payload: {
        supplierId: Types.ObjectId,
        name: string,
        email: string,
        phone: string,
        isActive: boolean,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.SUPPLIER_ADD,
            title: 'New Supplier Onboarded 🏢',
            body: `Supplier "${payload.name}" (${payload.email}) was added successfully and is available for Purchase Orders.`,
            referenceId: payload.supplierId,
            eventName: 'supplier_created_event',
            referenceModel: ReferenceModelEnum.SUPPLIER,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('supplier.updated')
    async handleSupplierUpdated(payload: {
        supplierId: Types.ObjectId,
        name: string,
        changedFields: string[],
        isActive?: boolean,
        actorId: Types.ObjectId
    }) {
        const statusText = payload.changedFields.includes('isActive') 
            ? ` Status updated to ${payload.isActive ? 'Active' : 'Inactive'}.` 
            : '';

        await this.dashboardNotification({
            permission: PermissionEnum.SUPPLIER_UPDATE,
            title: 'Supplier Profile Updated ✏️',
            body: `Supplier details for "${payload.name}" were updated (${payload.changedFields.join(', ')}).${statusText}`,
            referenceId: payload.supplierId,
            eventName: 'supplier_updated_event',
            referenceModel: ReferenceModelEnum.SUPPLIER,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: payload.isActive === false ? NotificationTypeEnum.ALERT : NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('supplier.removed')
    async handleSupplierRemoved(payload: {
        supplierId: Types.ObjectId,
        name: string,
        email: string,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.SUPPLIER_DELETE,
            title: 'Supplier Record Deleted ⚠️',
            body: `Supplier "${payload.name}" (${payload.email}) was removed from the system.`,
            referenceId: payload.supplierId,
            eventName: 'supplier_removed_event',
            referenceModel: ReferenceModelEnum.SUPPLIER,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.ALERT,
        });
    }
//======================== Warehouse =======================================
    @OnEvent('warehouse.created')
    async handleWarehouseCreated(payload: {
        warehouseId: Types.ObjectId,
        name: string,
        code: string,
        isMain: boolean,
        managerId: Types.ObjectId,
        actorId: Types.ObjectId
    }) {
        const mainBadge = payload.isMain ? ' (Primary Hub ⭐)' : '';

        await this.dashboardNotification({
            permission: PermissionEnum.WAREHOUSE_CREATE,
            title: 'New Warehouse Registered 🏭',
            body: `Warehouse "${payload.name}" [Code: ${payload.code}] has been successfully created${mainBadge}.`,
            referenceId: payload.warehouseId,
            eventName: 'warehouse_created_event',
            referenceModel: ReferenceModelEnum.WAREHOUSE,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('warehouse.updated')
    async handleWarehouseUpdated(payload: {
        warehouseId: Types.ObjectId,
        name: string,
        code: string,
        isMain: boolean,
        isActive?: boolean,
        hasManagerChanged: boolean,
        changedFields: string[],
        actorId: Types.ObjectId
    }) {
        let isCriticalChange = false;
        let changeDetails = `Warehouse "${payload.name}" updated (${payload.changedFields.join(', ')}).`;

        if (payload.changedFields.includes('isMain') && payload.isMain) {
            changeDetails = `Warehouse "${payload.name}" has been set as the PRIMARY Main Hub ⭐.`;
            isCriticalChange = true;
        } else if (payload.changedFields.includes('isActive') && payload.isActive === false) {
            changeDetails = `Warehouse "${payload.name}" has been DEACTIVATED 🛑. Order fulfillment to this hub is suspended.`;
            isCriticalChange = true;
        }

        await this.dashboardNotification({
            permission: PermissionEnum.WAREHOUSE_UPDATE,
            title: isCriticalChange ? 'Critical Warehouse Change ⚠️' : 'Warehouse Info Updated ✏️',
            body: changeDetails,
            referenceId: payload.warehouseId,
            eventName: 'warehouse_updated_event',
            referenceModel: ReferenceModelEnum.WAREHOUSE,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: isCriticalChange ? NotificationTypeEnum.ALERT : NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('warehouse.removed')
    async handleWarehouseRemoved(payload: {
        warehouseId: Types.ObjectId,
        name: string,
        code: string,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.WAREHOUSE_DELETE,
            title: 'Warehouse Permanently Removed 🚨',
            body: `Warehouse "${payload.name}" [Code: ${payload.code}] was deleted from system records.`,
            referenceId: payload.warehouseId,
            eventName: 'warehouse_removed_event',
            referenceModel: ReferenceModelEnum.WAREHOUSE,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.ALERT,
        });
    }
//======================== Warehouse Transform =======================================
    @OnEvent('warehouse-transform.created')
    async handleWarehouseTransformCreated(payload: {
        transformId: Types.ObjectId,
        fromWarehouseName: string,
        toWarehouseName: string,
        itemsCount: number,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
        permission: PermissionEnum.WAREHOUSE_TRANSFORM_CREATE,
        title: 'New Stock Transfer Request 🚚',
        body: `Transfer request created from "${payload.fromWarehouseName}" to "${payload.toWarehouseName}" containing ${payload.itemsCount} items. Pending approval.`,
        referenceId: payload.transformId,
        eventName: 'warehouse_transform_created_event',
        referenceModel: ReferenceModelEnum.TRANSFER,
        payload,
        roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
        type: NotificationTypeEnum.SYSTEM,
    });
    }
    @OnEvent('warehouse-transform.updated')
    async handleWarehouseTransformUpdated(payload: {
        transformId: Types.ObjectId,
        changedFields: string[],
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.WAREHOUSE_TRANSFORM_UPDATE,
            title: 'Transfer Request Updated ✏️',
            body: `Details for stock transfer request [${payload.transformId.toString()}] were updated (${payload.changedFields.join(', ')}).`,
            referenceId: payload.transformId,
            eventName: 'warehouse_transform_updated_event',
            referenceModel: ReferenceModelEnum.TRANSFER,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.SYSTEM,
        });
    }

    @OnEvent('warehouse-transform.approved')
    async handleWarehouseTransformApproved(payload: {
        transformId: Types.ObjectId,
        fromWarehouseName: string,
        toWarehouseName: string,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
        permission: PermissionEnum.WAREHOUSE_TRANSFORM_UPDATE,
        title: 'Stock Transfer Approved & In-Transit 📦',
        body: `Stock transfer request from [${payload.fromWarehouseName}] to [${payload.toWarehouseName}] has been approved. Items are now in transit.`,
        referenceId: payload.transformId,
        eventName: 'warehouse_transform_approved_event',
        referenceModel: ReferenceModelEnum.TRANSFER,
        payload,
        roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
        type: NotificationTypeEnum.SYSTEM,
    });
    }

    @OnEvent('warehouse-transform.received')
    async handleWarehouseTransformReceived(payload: {
        transformId: Types.ObjectId,
        toWarehouseName: string,
        fromWarehouseName: string,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
        permission: PermissionEnum.WAREHOUSE_TRANSFORM_UPDATE,
        title: 'Stock Transfer Successfully Received ✅',
        body: `Transfer from [${payload.fromWarehouseName}] to [${payload.toWarehouseName}] has been safely received and inventory was incremented at the destination hub.`,
        referenceId: payload.transformId,
        eventName: 'warehouse_transform_received_event',
        referenceModel: ReferenceModelEnum.TRANSFER,
        payload,
        roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
        type: NotificationTypeEnum.SYSTEM,
    });
    }
    @OnEvent('warehouse-transform.cancelled')
    async handleWarehouseTransformCancelled(payload: {
    transformId: Types.ObjectId,
    fromWarehouseName: string,
    toWarehouseName: string,
    reason?: string,
    actorId: Types.ObjectId
    }) {
    const reasonText = payload.reason ? ` Reason: "${payload.reason}".` : '';
    await this.dashboardNotification({
        permission: PermissionEnum.WAREHOUSE_TRANSFORM_UPDATE,
        title: 'Transfer Request Cancelled 🚫',
        body: `Transfer request [${payload.fromWarehouseName}] to [${payload.toWarehouseName}] was cancelled.${reasonText}`,
        referenceId: payload.transformId,
        eventName: 'warehouse_transform_cancelled_event',
        referenceModel: ReferenceModelEnum.TRANSFER,
        payload,roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
        type: NotificationTypeEnum.ALERT,
    });
    }

    @OnEvent('warehouse-transform.removed')
    async handleWarehouseTransformRemoved(payload: {
        transformId: Types.ObjectId,
        actorId: Types.ObjectId
    }) {
        await this.dashboardNotification({
            permission: PermissionEnum.WAREHOUSE_TRANSFORM_DELETE,
            title: 'Transfer Record Deleted ⚠️',
            body: `Pending warehouse transfer request [${payload.transformId.toString()}] was removed from the system.`,
            referenceId: payload.transformId,
            eventName: 'warehouse_transform_removed_event',
            referenceModel: ReferenceModelEnum.TRANSFER,
            payload,
            roles: [RoleEnum.ADMIN, RoleEnum.SUPERADMIN],
            type: NotificationTypeEnum.ALERT,
        });
    }
}
