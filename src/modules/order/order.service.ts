/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { InventoryMovementService } from './../../common/service/inventory-movement.service';
import { PaymentService } from './../../common/service/payment.service';
import { CouponRepository , SettingsRepository , FinancialReviewRepository , ShippingZoneRepository, OrderRepository , ProductVariantRepository , InventoryRepository , InventoryMovementRepository , CartRepository, WareHouseRepository, PaymentRepository } from './../../DB/Repository';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AllOrdersDTO, CancelDTO, CreateOrderDto, CreateOrderGQLDTO, GetOrderGQLDTO, RefundArgs, RefundDTO, RefundOrderRequestArgs, RefundOrderRequestDTO, RejectRefundArgs, RejectRefundDTO } from './dto';
import { HCouponDocument, HOrderDocument, HUserDocument } from 'src/DB/models';
import { Types } from 'mongoose';
import { DatabaseService } from 'src/DB/service/database.service';
import { IInventoryMovement, IOrder, IOrderItem, IPagination } from 'src/common/interface';
import { CouponTypeEnum, governorateEnum, InventoryMovementType, OrderStatusEnum, OrderSortEnum, PaymentMethodEnum, PaymentStatusEnum, ProviderPaymentEnum, ReferenceModelEnum, RoleEnum, SortEnum, CacheKeyEnum, LogActionEnum, CashReturnMethodEnum, FinancialCategoryEnum, FinancialSourceEnum, RefundTypeEnum, SharedCurrencyEnum, RefundResoneEnum, ActionStockTypeEnum } from 'src/common/enum';
import type{ Request } from 'express';
import Stripe, { MetadataParam } from 'Stripe'
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { OrderActor } from 'src/common/types';
import { CacheService } from 'src/common/service/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdjustStockService } from 'src/common/service/product-variant.service';
import { convertAmountToBaseCurrency } from 'src/common/utils/convert-currency';
import { IStockChangedPayload } from 'src/common/listener';
@Injectable()
export class OrderService {
  constructor(
    private readonly cartRepository : CartRepository,
    private readonly inventoryMovementRepository : InventoryMovementRepository,
    private readonly wareHouseRepository : WareHouseRepository,
    private readonly redis : CacheService,
    private readonly inventoryRepository : InventoryRepository,
    private readonly couponRepository : CouponRepository,
    private readonly productVariantRepository : ProductVariantRepository,
    private readonly orderRepository : OrderRepository,
    private readonly inventoryMovementService : InventoryMovementService,
    private readonly dataBaseService : DatabaseService,
    private readonly shippingZoneRepository : ShippingZoneRepository,
    private readonly paymentRepository : PaymentRepository,
    private readonly paymentService : PaymentService,
    private readonly eventEmitter : EventEmitter2,
    private readonly settingsRepository : SettingsRepository,
    private readonly financialReviewRepository : FinancialReviewRepository,
    private readonly adjustStockService: AdjustStockService,  
  ){}

  async create({currency , paymentMethod , shippingAddress , couponCode}: CreateOrderGQLDTO , user : HUserDocument) : Promise<IOrder> {
    const session =  await this.dataBaseService.startSession()
    try {
      session.startTransaction()
      
      const cart = await this.cartRepository.findOne({filter : {createdBy : user._id}})
      if (!cart) {
        throw new NotFoundException("Cart is empty")
      }
      const ids = cart.items.map(item => item.variantId)
      const inventories = await this.inventoryRepository.find({filter : {productVariantId : {$in : ids}} , options : {session}})
      if (!inventories.length) {
        throw new NotFoundException("some Products out of stock")
      }
      const shippingZone = await this.shippingZoneRepository.findOne({filter : {governorate : shippingAddress.governorate as governorateEnum} , options : {session}})
      if(!shippingZone) throw new NotFoundException(`We don't deliver to this governorate ${shippingAddress.governorate}`)
      const wareHouseIds = inventories.map(item => item.wareHouseId)
      const warehouses = await this.wareHouseRepository.find({filter : {_id : {$in : wareHouseIds as Types.ObjectId[]} , isActive : true},options:{session}})
      const variantIds = inventories.map(item => item.productVariantId)
      const variants = await this.productVariantRepository.find({filter : {_id : {$in : variantIds as Types.ObjectId[]}, isPublished : true },options:{session}})
      const variantMap = new Map(variants.map(variant => [variant._id.toString(), variant]));
      const wareHouseMap = new Map(warehouses.map(wh => [wh._id.toString(), wh]));

      const inventoryGroupMap = new Map<string, any[]>();
      for (const inv of inventories) {
        const vId = inv.productVariantId.toString();
        if (!inventoryGroupMap.has(vId)) {
          inventoryGroupMap.set(vId, []);
        }
        inventoryGroupMap.get(vId)!.push(inv);
      }

      const inventoryUpdates: any[] = [];
      const stockChangePayloads: IStockChangedPayload[] = [];
      const orderItems: IOrderItem[] = [];
      let subtotalAmount: number = 0;
      let isSameGovernorateZone : boolean = false
      for (const item of cart.items) {
        const productInventories = inventoryGroupMap.get(item.variantId.toString()) || [];
        let selectedInventory = null;
        let selectedWarehouse = null;
        for (const inv of productInventories) {
          const wh = wareHouseMap.get(inv.wareHouseId.toString());
          if (wh && wh.address.governorate === shippingAddress.governorate && inv.availableQuantity >= item.quantity) {
            selectedInventory = inv;
            selectedWarehouse = wh;
            isSameGovernorateZone = true
            break;
          }
        }
        if (!selectedInventory) {
          for (const inv of productInventories) {
            const wh = wareHouseMap.get(inv.wareHouseId.toString());
            if (wh && wh.isMain === true && inv.availableQuantity >= item.quantity) {
              selectedInventory = inv;
              selectedWarehouse = wh;
              break;
            }
          }
        }
        if (!selectedInventory) {
          for (const inv of productInventories) {
            const wh = wareHouseMap.get(inv.wareHouseId.toString());
            if (wh && inv.availableQuantity >= item.quantity) {
              selectedInventory = inv;
              selectedWarehouse = wh;
             break;
            }
          }
        }
        
        if (!selectedInventory || !selectedWarehouse) {
          throw new BadRequestException(`Product variant ${item.skuSnapshot} is out of stock or insufficient in warehouses.`);
        }
        const variant = variantMap.get(item.variantId.toString())
        if (!variant) {
          throw new NotFoundException("variant not found")
        }
        const itemPrice = variant.price
        const itemSubTotal = item.quantity * itemPrice
        subtotalAmount +=itemSubTotal

        orderItems.push({
          imageSnapshot : item.imageSnapshot || "", priceSnapshot : itemPrice , quantity : item.quantity,
          skuSnapshot : item.skuSnapshot , subTotal : itemSubTotal , variantId : item.variantId as Types.ObjectId,
          warehouseId : selectedWarehouse._id
        })
          
        inventoryUpdates.push(this.inventoryMovementService.buildInventoryUpdateOrder({
          inventory : selectedInventory , quantity : item.quantity
        }))
        const previousAvailable = selectedInventory.availableQuantity;
        const newAvailable = previousAvailable - item.quantity;
        stockChangePayloads.push({
          inventoryId: selectedInventory._id.toString(),
          productVariantId: selectedInventory.productVariantId.toString(),
          sku: selectedInventory.skuSnapshot, productTitle: selectedInventory.productTitleSnapshot,
          warehouseId: selectedInventory.wareHouseId.toString(), previousAvailableQuantity: previousAvailable,
          newAvailableQuantity: newAvailable, lowStockThreshold: selectedInventory.lowStockThreshold,
          actionType: ActionStockTypeEnum.ORDER_SALE,
        });

      }
      const shippingAmount = isSameGovernorateZone ? shippingZone.mainCost : shippingZone.price;
      await this.inventoryRepository.bulkWrite(inventoryUpdates , {session , ordered : true})
      let discountAmount : number = 0
      let coupon : HCouponDocument | null = null
      if (couponCode) {
        coupon = await this.couponRepository.findOne({filter : {code : couponCode , isActive : true , expiresAt : {$gt : new Date()} , startAt : {$lt : new Date()}} , options : {session}})
        if (!coupon) {
          throw new BadRequestException("Coupon is invalid or expired");
        }
        if (coupon.usedCount >= coupon.usageLimit) {
          throw new BadRequestException("Coupon usage limit exceeded");
        }
        if (coupon.minOrderAmount && subtotalAmount < coupon.minOrderAmount) {
          throw new BadRequestException(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
        }
        if (coupon.type === CouponTypeEnum.PERCENT) {
          discountAmount = Number((coupon.value / 100) *  subtotalAmount)
          if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount
          }
        }else{
          discountAmount = coupon.value
        }
      }
      const totalAmount = (subtotalAmount + shippingAmount) - discountAmount
      const orderNumber = `ShoopyGO-${Math.floor(1000 + Math.random() * 9000)}`
      const order = await this.orderRepository.createOne({data : {
        items : orderItems ,  createdBy : user._id , currency , paymentMethod,
        couponCode , couponId : coupon?._id , shippingAddress , status : OrderStatusEnum.PENDING,
        discountAmount , shippingAmount , subtotalAmount , totalAmount , orderNumber , paymentStatus : PaymentStatusEnum.PENDING
      },options : {session , ordered : true }})
      if(!order) throw new BadRequestException(`Fail to create order`)
      await session.commitTransaction()
      for (const payload of stockChangePayloads) {
        this.eventEmitter.emit('inventory.stock_changed', payload);
      }
      this.eventEmitter.emit('audit-log.create',{
        action : LogActionEnum.CREATE , isSystem : false , referenceId : order._id ,
        referenceModel : ReferenceModelEnum.ORDER , actorId : user._id,
        metadata : {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          couponCode: order.couponCode || null,
        }
      })
      return order
    } catch (error : any) {
      await session.abortTransaction()
      throw new BadRequestException(error.message || error)
    } finally {
      await session.endSession()
    }
  }

  async checkout(orderId: Types.ObjectId , user : HUserDocument):Promise<{order : IOrder , payment_url : string | null}>{
    const order = await this.orderRepository.findOne({filter : {_id : orderId , createdBy : user._id , paymentStatus : {$in : [PaymentStatusEnum.PENDING , PaymentStatusEnum.PROCESSING]} , status : OrderStatusEnum.PENDING}})
    if (!order) {
      throw new NotFoundException("order not found or expire")
    }
    const shippingZone = order.shippingAddress
    const paymentMethod = order.paymentMethod
    if (paymentMethod === PaymentMethodEnum.CASH) {
      this.eventEmitter.emit('audit-log.create', {
        action: LogActionEnum.CHECKOUT,
        isSystem: false,
        referenceId: order._id,
        referenceModel: ReferenceModelEnum.ORDER,
        actorId: user._id,
        metadata: {
          orderNumber: order.orderNumber,
          paymentMethod: PaymentMethodEnum.CASH,
          paymentStatus: order.paymentStatus
        }
      });
      this.eventEmitter.emit('order.checkout_cash', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: user._id.toString(),
        totalAmount: order.totalAmount,
        currency: order.currency,
        governorate: shippingZone.governorate,
        itemsCount: order.items.length,
      });
      return {order , payment_url : null}
    }else{
      if (order.stripeSessionId && order.stripeSessionUrl && order.paymentStatus === PaymentStatusEnum.PROCESSING) {
        await this.cartRepository.findOneAndDelete({filter : {createdBy : user._id}})
        await this.redis.clearCacheKey({key : CacheKeyEnum.CART , userId : user._id})
        return {order , payment_url : order.stripeSessionUrl} 
      }
      const stripeLineItems = order.items.map(item => ({
        price_data: {
          currency: order.currency.toLowerCase(),
          product_data: { name: item.skuSnapshot, images: item.imageSnapshot ? [item.imageSnapshot] : []},
          unit_amount: item.priceSnapshot * 100,
        },
        quantity: item.quantity,
      }));

      const shipping_options = [
        {
          shipping_rate_data : {
          type : 'fixed_amount' as const,
          fixed_amount : {
          amount : order.shippingAmount * 100,
          currency : order.currency
          },
          display_name : `Shipping costs to ${shippingZone.governorate}`,
          }
        }
      ]
      const discounts = []
      if (order.discountAmount && order.discountAmount > 0) {
        const couponCreated = await this.paymentService.createCoupon({amount_off : order.discountAmount * 100 , name : order?.couponCode  , currency : order.currency , duration : "once" , metadata : {coupondId : order.couponId?.toString() ?? null}})
        discounts.push({coupon : couponCreated.id})
      }
      const session = await this.paymentService.chckoutSession({
        customer_email : user.email , mode : "payment" , currency : order.currency , discounts ,
        metadata : {orderId : order._id.toString()},line_items : stripeLineItems , shipping_options
      })
      const orderUpdated = await this.orderRepository.findOneAndUpdate({
        filter : {_id : orderId , createdBy : user._id , status : OrderStatusEnum.PENDING} ,
        update : {paymentStatus : PaymentStatusEnum.PROCESSING , stripeSessionId : session.id , stripeSessionUrl : session.url}
      })
      if(!orderUpdated) throw new BadRequestException(`Fail to confirm order`)
      await this.redis.clearCacheKey({key : CacheKeyEnum.ORDER , userId : order.createdBy as Types.ObjectId , extra: order._id})
      this.eventEmitter.emit('audit-log.create', {
        action: LogActionEnum.CHECKOUT,
        isSystem: false,
        referenceId: order._id,
        referenceModel: ReferenceModelEnum.ORDER,
        actorId: user._id,
        metadata: {
          orderNumber: order.orderNumber,
          paymentMethod: PaymentMethodEnum.CARD,
          stripeSessionId: session.id,
          paymentStatusBefore: order.paymentStatus,
          paymentStatusAfter: PaymentStatusEnum.PROCESSING,
          totalAmount: order.totalAmount
        }
      });
      this.eventEmitter.emit('order.created', {
        orderId: order._id, orderNumber: order.orderNumber,
        userId: user._id, totalAmount: order.totalAmount,
        currency: order.currency,paymentMethod: order.paymentMethod,
      });
      await this.cartRepository.findOneAndDelete({filter : {createdBy : user._id} })
      await this.redis.clearCacheKey({key : CacheKeyEnum.CART , userId : user._id})
      return {order : orderUpdated , payment_url : session.url}
      }
      
  }

  async webhook(req: Request): Promise<Stripe.CheckoutSessionCompletedEvent> {
  const event = await this.paymentService.webhook(req);
  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = (session.metadata as MetadataParam).orderId;

  const dbSession = await this.dataBaseService.startSession();
  let updatedOrder: HOrderDocument;
  try {
    dbSession.startTransaction();
    const order = await this.orderRepository.findOneAndUpdate({
      filter: { _id: TransformToObjectId(orderId as unknown as string), paymentStatus: PaymentStatusEnum.PROCESSING, paymentMethod: PaymentMethodEnum.CARD, status: OrderStatusEnum.PENDING },
      update: { paymentStatus: PaymentStatusEnum.PAID, status: OrderStatusEnum.CONFIRMED, confirmedAt: new Date(), intentId: event.data.object.payment_intent },
      options: { session: dbSession , returnDocument : "after" }
    });
    if (!order) throw new NotFoundException(`Order not found or already processed`);
    updatedOrder = order
    if (order.couponId) {
      await this.couponRepository.findOneAndUpdate({filter : {_id : order.couponId} , update : {$inc : {usedCount : 1}} , options : {session : dbSession}})
    }
    const invIds = order.items.map(item => item.variantId);
    const inventories = await this.inventoryRepository.find({ filter: { productVariantId: { $in: invIds } }, options: { session: dbSession } });
    
    const wareIds = inventories.map(war => war.wareHouseId);
    const warehouses = await this.wareHouseRepository.find({ filter: { _id: { $in: wareIds as Types.ObjectId[] } }, options: { session: dbSession } });
    
    const settings = await this.settingsRepository.findOne({ filter: {}, options: { session: dbSession } });
    if (!settings) throw new NotFoundException("Settings not exists");
    const baseCurrency = settings.baseCurrency;

    const inventoryMap = new Map(inventories.map(inv => [inv.productVariantId.toString(), inv]));
    const wareHouseMap = new Map(warehouses.map(ware => [ware._id.toString(), ware]));

    const inventoryUpdates = [];
    const productVariantUpdates = [];
    const movements : any[] = [];
    const stockChangePayloads: IStockChangedPayload[] = []
    let totalCogsInOrderCurrency : number = 0

    for (const item of order.items) {
      const inventory = inventoryMap.get(item.variantId.toString());
      if (!inventory) throw new NotFoundException(`Inventory not found`);
      const warehouse = wareHouseMap.get(inventory.wareHouseId.toString());
      if (!warehouse) throw new NotFoundException(`Warehouse not found`);
      const itemCost = inventory.costPrice || 0
      totalCogsInOrderCurrency += itemCost * item.quantity
      const beforeQuantity = inventory.quantity;
      const afterQuantity = beforeQuantity - item.quantity;

      inventoryUpdates.push(this.inventoryMovementService.buildInventoryUpdateOrderStatus({ inventory, quantity: item.quantity, type: 'confirm' }));
      movements.push(this.inventoryMovementService.buildInventoryMovementOrder({
        inventory, warehouse, afterQuantity, beforeQuantity, createdBy: order.createdBy as Types.ObjectId, isSystemAction: true,
        item, referenceId: order._id, referenceModel: ReferenceModelEnum.ORDER, type: InventoryMovementType.ORDER
        })
      ); 
      productVariantUpdates.push(this.adjustStockService.adjustStock({
        productVariantId : item.variantId , quantityChange : item.quantity , type : 'dec'
      }))
    }
    const updateInventory = await this.inventoryRepository.bulkWrite(inventoryUpdates, { ordered: true, session: dbSession });
    if(!updateInventory) throw new BadRequestException("Fail to update inventory")
    const updateProductVrainat = await this.productVariantRepository.bulkWrite(productVariantUpdates, { ordered: true, session: dbSession });
    if(!updateProductVrainat) throw new BadRequestException("Fail to update inventory")
    const updateMovement =  await this.inventoryMovementRepository.create({data : movements, options :{ ordered: true, session: dbSession }});
    if(!updateMovement) throw new BadRequestException("Fail to update Movements")

    const payment = await this.paymentRepository.createOne({
      data: { amount: order.totalAmount, metadata: session.metadata,
        status: PaymentStatusEnum.PAID, paymentMethodType: PaymentMethodEnum.CARD,
        paidAt: new Date(), orderId : TransformToObjectId(orderId as unknown as string), provider: ProviderPaymentEnum.STRIPE, refundedAmount: 0,
        currency: order.currency, intentId: order.intentId , isSystemAction : true
      },
      options: { session: dbSession }
    });
    if(!payment)throw new BadRequestException(`Fail to create payment`)
    let revenueInBaseCurrency = order.totalAmount;
    if (order.currency.toUpperCase() !== baseCurrency) {
      revenueInBaseCurrency = Number(convertAmountToBaseCurrency(order.totalAmount , order.currency.toUpperCase() as SharedCurrencyEnum , settings).toFixed(2));
    }
    const financialReview = await this.financialReviewRepository.createOne({
      data : {
        amount : revenueInBaseCurrency , category : FinancialCategoryEnum.REVENUE , currency :  baseCurrency ,
        isSystem : true , discountAmountSnapshot : order.discountAmount , referenceId : order._id,
        referenceModel : ReferenceModelEnum.ORDER , source : FinancialSourceEnum.ORDER , 
        shippingCostSnapshot : order.shippingAmount , costOfGoodsSold : Number(totalCogsInOrderCurrency.toFixed(2)), 
        notes : `Online payment received via ${order.paymentMethod} (${order.currency.toUpperCase()}). Order #${order.orderNumber}. Transaction/Intent ID: ${event.data.object.payment_intent}. Net Revenue: ${revenueInBaseCurrency} ${baseCurrency}.` 
      } ,
      options : {session : dbSession , ordered : true}})
    if(!financialReview) throw new BadRequestException(`Fail to create financial review for this order ${order._id.toString()}`)
    await dbSession.commitTransaction();
    this.eventEmitter.emit('audit-log.create',{
      action : LogActionEnum.WEBHOOK_RECEIVED,isSystem : true , referenceId : order._id,
      referenceModel : ReferenceModelEnum.ORDER , actorId : null,
      metaData : {
        orderNumber: order.orderNumber,
          stripeSessionId: session.id,
          stripeCustomerId: session.customer,
          amountPaid: session.amount_total ? (session.amount_total / 100) : order.totalAmount, 
          currency: session.currency ? session.currency.toUpperCase() : order.currency.toUpperCase(),
          paymentStatusBefore: PaymentStatusEnum.PROCESSING,
          paymentStatusAfter: PaymentStatusEnum.PAID,
          statusBefore: OrderStatusEnum.PENDING,
          statusAfter: OrderStatusEnum.CONFIRMED
      }
    })
    this.eventEmitter.emit('order.paid', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.createdBy,
      totalAmount: order.totalAmount,
      currency: order.currency,
      paymentMethod: PaymentMethodEnum.CARD,
    });
    this.eventEmitter.emit('financial.review.created', {
      financialReviewId: financialReview._id, category: FinancialCategoryEnum.REVENUE,
      source: FinancialSourceEnum.ORDER, amount: revenueInBaseCurrency,
      currency: baseCurrency,referenceId: order._id,
      referenceModel: ReferenceModelEnum.ORDER,
      orderNumber: order.orderNumber,paymentMethod: order.paymentMethod,
      isAutomated: true,
    });
    await this.redis.clearCacheKey({key : CacheKeyEnum.ORDER , userId : order.createdBy as Types.ObjectId , extra: order._id})
    return event;
  } catch (error : any) {
    console.error("❌ Webhook Error:", error);
    await dbSession.abortTransaction();
    throw new BadRequestException(error?.message || 'Webhook processing failed');
  } finally {
    await dbSession.endSession();
  }
  }

  async confirmOrder(orderId: Types.ObjectId , user : HUserDocument) : Promise<{message : string}> {
    const session = await this.dataBaseService.startSession()
    try {
      session.startTransaction()
      const order = await this.orderRepository.findOne({filter : {_id : orderId , status : OrderStatusEnum.PENDING , paymentMethod : PaymentMethodEnum.CASH , paymentStatus : PaymentStatusEnum.PENDING}, options : {session}})
      if (!order) {
        throw new NotFoundException(`Order not found or already confirmed`)
      }
      const invIds = order.items.map(item => item.variantId)
      const inventories = await this.inventoryRepository.find({filter : {productVariantId : {$in : invIds}}, options : {session}})
      if (!inventories.length) {
        throw new NotFoundException("Some products not found or out of stock")
      }
      const wareIds = inventories.map(war => war.wareHouseId)
      const warehouses = await this.wareHouseRepository.find({filter : {_id : {$in : wareIds as Types.ObjectId[]}} , options : {session}})
      if (!warehouses.length) throw new NotFoundException("warehouses not found")
      const inventoryMap = new Map(inventories.map(inv => [inv.productVariantId.toString() , inv]))
      const wareHouseMap = new Map(warehouses.map(ware => [ware._id.toString() , ware]))
      const inventoryUpdates = []
      const productVariantUpdates = [];
      const movements : any = []
      for (const item of order.items) {
        const inventory = inventoryMap.get(item.variantId.toString())
        if(!inventory) throw new NotFoundException(`Inventory not found`)
        const warehouse = wareHouseMap.get(inventory.wareHouseId.toString())
        if(!warehouse) throw new NotFoundException(`Warehouse not found in inventory ${inventory.skuSnapshot}`)
        const beforeQuantity = inventory.quantity
        const afterQuantity = beforeQuantity - item.quantity
        inventoryUpdates.push(this.inventoryMovementService.buildInventoryUpdateOrderStatus({inventory ,quantity : item.quantity , type : 'confirm'}))
        movements.push(this.inventoryMovementService.buildInventoryMovementOrder({
          inventory , warehouse , afterQuantity , beforeQuantity , createdBy : user._id,isSystemAction : false , 
          item , referenceId : order._id , referenceModel : ReferenceModelEnum.ORDER  , type : InventoryMovementType.ORDER
        }))
        productVariantUpdates.push(this.adjustStockService.adjustStock({
          productVariantId : item.variantId , quantityChange : item.quantity , type : 'dec'
        }))
      }
      
      const updateInventory = await this.inventoryRepository.bulkWrite(inventoryUpdates, { ordered: true, session });
      if(!updateInventory) throw new BadRequestException("Fail to update inventory")
      const updateProductVrainat = await this.productVariantRepository.bulkWrite(productVariantUpdates, { ordered: true, session });
      if(!updateProductVrainat) throw new BadRequestException("Fail to update inventory")
      const updateMovement =  await this.inventoryMovementRepository.create({data : movements, options :{ ordered: true, session }});
      if(!updateMovement) throw new BadRequestException("Fail to update Movements")
      if (order.couponId) {
        await this.couponRepository.findOneAndUpdate({filter : {_id : order.couponId} , update : {$inc : {usedCount : 1}} , options : {session}})
      }
      const updateOrder = await this.orderRepository.findOneAndUpdate({
        filter : {_id : orderId , status : OrderStatusEnum.PENDING , paymentMethod : PaymentMethodEnum.CASH ,
        paymentStatus : PaymentStatusEnum.PENDING},
        update : {paymentStatus : PaymentStatusEnum.PROCESSING , status : OrderStatusEnum.CONFIRMED , 
        confirmedAt : new Date() , confirmedBy : user._id},options : {session}
      })
      if (!updateOrder) {
        throw new NotFoundException(`Fail to update order ${order.orderNumber}`)
      }
      const payment = await this.paymentRepository.createOne({data : {
        amount : order.totalAmount , status : PaymentStatusEnum.PROCESSING , createdBy : user._id,
        paymentMethodType : PaymentMethodEnum.CASH , orderId , refundedAmount : 0 , currency : order.currency
      },options:{session}})
      if(!payment)throw new BadRequestException(`Fail to create payment`)
      await session.commitTransaction()
      this.eventEmitter.emit('audit-log.create', {
      action: LogActionEnum.ORDER_CONFIRMED,
      isSystem: false,
      referenceId: order._id,
      referenceModel: ReferenceModelEnum.ORDER,
      actorId: user._id,
      metadata: {
        orderNumber: order.orderNumber,
        paymentMethod: PaymentMethodEnum.CASH,
        statusBefore: OrderStatusEnum.PENDING,
        statusAfter: OrderStatusEnum.CONFIRMED
      }
      });
      await this.redis.clearCacheKey({key : CacheKeyEnum.ORDER , userId : order.createdBy as Types.ObjectId , extra: order._id})
      this.eventEmitter.emit('order.confirmed', {
        orderId: order._id,orderNumber: order.orderNumber,
        userId: order.createdBy,confirmedBy: user._id,
        totalAmount: order.totalAmount,currency: order.currency,
      });
      return {message : `Order ${updateOrder.orderNumber} confirmed successfuly`}
    } catch (error : any) {
      await session.abortTransaction()
      throw new BadRequestException(error?.message || error);
    } finally {
      await session.endSession()
    }

  }

  async cancelOrder(orderId: Types.ObjectId, user: OrderActor, { cancelReasonOther, cancelReason }: CancelDTO): Promise<{message : string}> {
    const session = await this.dataBaseService.startSession();
    let shouldTriggerStripeRefund = false;
    let intentIdToRefund = '';
    try {
      session.startTransaction();
      const isSystem = 'role' in user && user.role === 'SYSTEM';
      const actorId = isSystem ? null : user._id;

      const order = await this.orderRepository.findOne({
        filter: { 
          _id: orderId, 
          status: OrderStatusEnum.PENDING,
          paymentStatus: { $in: [PaymentStatusEnum.PENDING, PaymentStatusEnum.PROCESSING, PaymentStatusEnum.PAID] }
        }, 
        options: { session }
      });
      if (!order) {
        throw new NotFoundException(`Order not found or cannot be cancelled`);
      }
      const invIds = order.items.map(item => item.variantId);
      const inventories = await this.inventoryRepository.find({ filter: { productVariantId: { $in: invIds } }, options: { session } });
      const wareIds = inventories.map(war => war.wareHouseId);
      const warehouses = await this.wareHouseRepository.find({ filter: { _id: { $in: wareIds as Types.ObjectId[] } }, options: { session } });
      const inventoryMap = new Map(inventories.map(inv => [inv.productVariantId.toString(), inv]));
      const wareHouseMap = new Map(warehouses.map(ware => [ware._id.toString(), ware]));
      
      const inventoryUpdates = [];
      const productVariantUpdates = [];
      const movements : Partial<IInventoryMovement>[] = [];
      const stockChangePayloads: IStockChangedPayload[] = [];
      for (const item of order.items) {
        const inventory = inventoryMap.get(item.variantId.toString());
        if (!inventory) throw new NotFoundException(`Inventory not found`);
        const warehouse = wareHouseMap.get(inventory.wareHouseId.toString());
        if (!warehouse) throw new NotFoundException(`Warehouse not found`);
        const isAlreadyPaid = order.paymentStatus === PaymentStatusEnum.PAID;
        const beforeQuantity = isAlreadyPaid ? inventory.quantity : inventory.availableQuantity;
        const afterQuantity = beforeQuantity + item.quantity;

        inventoryUpdates.push(this.inventoryMovementService.buildInventoryUpdateOrderStatus({ inventory, quantity: item.quantity, type: isAlreadyPaid ? 'refund' : 'cancel' }));
        movements.push(this.inventoryMovementService.buildInventoryMovementOrder({
        inventory, warehouse, afterQuantity, beforeQuantity, createdBy: actorId, isSystemAction : isSystem,
        item, referenceId: order._id, referenceModel: ReferenceModelEnum.ORDER, type: InventoryMovementType.RETURN
        }));
        productVariantUpdates.push(this.adjustStockService.adjustStock({productVariantId: item.variantId,quantityChange: item.quantity,type: 'inc',}),
        );
        
        const previousAvailable = inventory.availableQuantity;
        const newAvailable = previousAvailable + item.quantity;
        stockChangePayloads.push({
          inventoryId: inventory._id.toString(), productVariantId: item.variantId.toString(),
          sku: inventory.skuSnapshot, productTitle: inventory.productTitleSnapshot,
          warehouseId: inventory.wareHouseId.toString(), previousAvailableQuantity: previousAvailable,
          newAvailableQuantity: newAvailable, lowStockThreshold: inventory.lowStockThreshold,
          actionType: ActionStockTypeEnum.ORDER_CANCEL,
        } as IStockChangedPayload);
      }
      const updateInventory = await this.inventoryRepository.bulkWrite(inventoryUpdates, { ordered: true, session: session });
      if(!updateInventory.matchedCount) throw new BadRequestException("Fail to update inventory")
      const updateProductVariants = await this.productVariantRepository.bulkWrite(productVariantUpdates, { ordered: true, session: session });
      if(!updateProductVariants.matchedCount) throw new BadRequestException("Fail to update product variants")
      const updateMovement =  await this.inventoryMovementRepository.create({data : movements, options :{ ordered: true, session: session }});
      if(!updateMovement) throw new BadRequestException("Fail to update Movements")

      const updateOrder = await this.orderRepository.findOneAndUpdate({
        filter: { _id: orderId },
        update: { paymentStatus: PaymentStatusEnum.CANCELLED, status: OrderStatusEnum.CANCELLED,canceledAt: new Date(), 
        canceledBy: actorId, cancelReason, cancelReasonOther , canceledBySystem : isSystem 
        },
        options: { session , returnDocument : "after" }
      });
      if (!updateOrder) {
        throw new NotFoundException(`Fail to update order ${order.orderNumber}`)
      }
      if (order.couponId && (order.paymentStatus === PaymentStatusEnum.PAID || order.status === OrderStatusEnum.CONFIRMED)) {
        await this.couponRepository.findOneAndUpdate({filter : {_id : order.couponId}, update : {$inc : {usedCount : -1}} , options : {session}})
      }
      if (order.paymentMethod === PaymentMethodEnum.CARD && order.paymentStatus === PaymentStatusEnum.PAID) {
        if (!order.intentId) {
          throw new BadRequestException("Cannot refund this order because the Payment Intent ID (intentId) is missing.");
        }
        const payment = await this.paymentRepository.createOne({
          data: { amount: 0, status: PaymentStatusEnum.REFUNDED, paymentMethodType: PaymentMethodEnum.CARD, createdBy : actorId ,
          orderId, refundedAmount: order.totalAmount, currency: order.currency, intentId: order.intentId , isSystemAction : isSystem },
          options: { session }
        });
        if(!payment) throw new BadRequestException(`Fail to create payment`)
        shouldTriggerStripeRefund = true;
        intentIdToRefund = order.intentId;
      } else {
          const payment = await this.paymentRepository.createOne({
          data: { amount: 0, status: PaymentStatusEnum.CANCELLED, paymentMethodType: order.paymentMethod, createdBy : actorId ,
          orderId, refundedAmount: 0, currency: order.currency, isSystemAction : isSystem },
          options: { session }
          });
          if(!payment) throw new BadRequestException(`Fail to create payment`)
        }
      await session.commitTransaction();
      if (shouldTriggerStripeRefund && intentIdToRefund) {
        try {
          await this.paymentService.refund(intentIdToRefund);
        } catch (stripeErr: any) {
          console.error('❌ Stripe Refund Failed post-commit:', stripeErr);
        }
      }
      for (const payload of stockChangePayloads) {
        this.eventEmitter.emit('inventory.stock_changed', payload);
      }
      this.eventEmitter.emit('audit-log.create', {
          action: LogActionEnum.ORDER_CANCELLED,
          isSystem: isSystem,
          referenceId: order._id,
          referenceModel: ReferenceModelEnum.ORDER,
          actorId,
          metadata: {
            orderNumber: order.orderNumber, reason: cancelReason,
            cancelReasonOther : cancelReasonOther ? cancelReasonOther : null, statusBefore: order.status,
            statusAfter:  order.paymentMethod === PaymentMethodEnum.CARD ?  OrderStatusEnum.RETURNED : OrderStatusEnum.CANCELLED,
            restockedItemsCount: order.items.length,
            financialAction: order.paymentMethod === PaymentMethodEnum.CARD ? 'REQUIRES_STRIPE_REFUND' : 'NO_FINANCIAL_ACTION',  
            amountToRefund: order.paymentMethod === PaymentMethodEnum.CARD ? order.totalAmount : 0,
          }
      });
      this.eventEmitter.emit('order.cancelled', {
        orderId: order._id,orderNumber: order.orderNumber,
        userId: order.createdBy, cancelledBy: actorId ? actorId : 'SYSTEM',
        canceledBySystem: isSystem, reason: cancelReason, cancelReasonOther: cancelReasonOther || null,
        paymentMethod: order.paymentMethod,paymentStatus: order.paymentStatus,
      });
      await this.redis.clearCacheKey({key : CacheKeyEnum.ORDER , userId : order.createdBy as Types.ObjectId , extra: order._id})
      return {message : `Order ${updateOrder.orderNumber} cancelled successfuly`};
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error);
    } finally {
      await session.endSession();
    }
  }

  async shipped(orderId: Types.ObjectId , user : HUserDocument): Promise<{message : string}>{
    const order = await this.orderRepository.findOneAndUpdate({filter : {
    _id : orderId , status : OrderStatusEnum.CONFIRMED , paymentMethod : {$in : [PaymentMethodEnum.CASH , PaymentMethodEnum.CARD]} , 
    paymentStatus : {$in : [PaymentStatusEnum.PROCESSING , PaymentStatusEnum.PAID]}},
    update : {status  :OrderStatusEnum.SHIPPED}
    })
    if(!order) throw new NotFoundException(`Order not found or already shipped`)
    this.eventEmitter.emit('audit-log.create', {
      action: LogActionEnum.SHIP,
      isSystem: false,
      referenceId: order._id,
      referenceModel: ReferenceModelEnum.ORDER,
      actorId: user._id,
      metadata: {
        orderNumber: order.orderNumber,
        statusBefore: OrderStatusEnum.CONFIRMED,
        statusAfter: OrderStatusEnum.SHIPPED
      }
    });
    this.eventEmitter.emit('order.shipped', {
      orderId: order._id,orderNumber: order.orderNumber,
      userId: order.createdBy,shippingAddress: order.shippingAddress,
    });
    await this.redis.clearCacheKey({key : CacheKeyEnum.ORDER , userId : order.createdBy as Types.ObjectId , extra: order._id})
    return {message : `Order ${order.orderNumber} shipped successfuly`}
  }
  
  async paidOrder(orderId: Types.ObjectId , user : HUserDocument): Promise<{message : string}>{
    const session = await this.dataBaseService.startSession()
    try {
      session.startTransaction()
      const order = await this.orderRepository.findOne({filter : {
      _id : orderId , status : {$in : [OrderStatusEnum.CONFIRMED  , OrderStatusEnum.SHIPPED]}},
      options : {session}
      })
      if(!order) throw new NotFoundException(`Order not found or eligible for delivered`)
      const isCash = order.paymentMethod === PaymentMethodEnum.CASH
      const orderUpdates : Partial<HOrderDocument> = {
        status : OrderStatusEnum.DELIVERED,
        deliveredAt : new Date(),
        updatedBy : user._id
      }
      if(isCash) orderUpdates.paymentStatus = PaymentStatusEnum.PAID
      const updateOrder = await this.orderRepository.findOneAndUpdate({filter : {_id : orderId},update : orderUpdates,options : {session , returnDocument : "after"}})
      if (!updateOrder) throw new BadRequestException('Failed to update order status');
      if (isCash) {
        await this.paymentRepository.findOneAndUpdate({filter : {orderId , status : PaymentStatusEnum.PROCESSING} , 
          update : { status : PaymentStatusEnum.PAID , provider : ProviderPaymentEnum.CASH , paidAt : new Date() , updatedBy : user._id} , options : {session} 
        })
      }
      const settings = await this.settingsRepository.findOne({ filter: {}, options: { session } });
      if (!settings) throw new NotFoundException("Settings not exists");
      
      const baseCurrency = settings.baseCurrency;
      const varIds = order.items.map(item => item.variantId);
      const inventories = await this.inventoryRepository.find({ filter: { productVariantId: { $in: varIds } }, options: { session } });
      const inventoryMap = new Map(inventories.map(inv => [inv.productVariantId.toString(), inv]));

      let totalCogsInOrderCurrency : number = 0
      for (const item of order.items) {
        const inventory = inventoryMap.get(item.variantId.toString());
        if (!inventory) throw new NotFoundException(`Inventory record not found for variant: ${item.variantId}`);
        const unitCostInBase = inventory.costPrice || 0;
        totalCogsInOrderCurrency += unitCostInBase * item.quantity;
      }
      let revenueInBaseCurrency = order.totalAmount;
      const orderCurrencyUpper = order.currency.toUpperCase();
      if (orderCurrencyUpper !== baseCurrency) {
       const revenue = convertAmountToBaseCurrency(order.totalAmount , orderCurrencyUpper as SharedCurrencyEnum , settings)
       revenueInBaseCurrency = Number(revenue.toFixed(2))
      }
      if (isCash) {
        const financialReview = await this.financialReviewRepository.createOne({data :
          { amount : revenueInBaseCurrency , category : FinancialCategoryEnum.REVENUE , currency :  baseCurrency ,
            isSystem : false , discountAmountSnapshot : order.discountAmount , referenceId : order._id,
            referenceModel : ReferenceModelEnum.ORDER , source : FinancialSourceEnum.ORDER , createdBy : user._id,
            shippingCostSnapshot : order.shippingAmount , costOfGoodsSold : Number(totalCogsInOrderCurrency.toFixed(2)) ,
            notes : `Cash on Delivery (COD) collected for Order #${order.orderNumber}.`
          } 
          , options : {session , ordered : true}})
        if(!financialReview) throw new BadRequestException(`Fail to create financial review for this order ${order._id.toString()}`)  
        this.eventEmitter.emit('financial.review.created', {
          financialReviewId: financialReview._id,category: FinancialCategoryEnum.REVENUE,
          source: FinancialSourceEnum.ORDER,amount: revenueInBaseCurrency,
          currency: baseCurrency,referenceId: order._id,
          referenceModel: ReferenceModelEnum.ORDER,orderNumber: order.orderNumber,
          paymentMethod: PaymentMethodEnum.CASH, actorId: user._id,
        });
      }
      await session.commitTransaction()
      this.eventEmitter.emit('audit-log.create', {
        action: LogActionEnum.DELIVER,
        actorId: user._id,
        referenceId: order._id,
        referenceModel: ReferenceModelEnum.ORDER,
        metadata: {
          orderNumber: order.orderNumber,
          paymentMethod: order.paymentMethod,
          deliveredAt: new Date(),
          statusBefore: order.status,
          statusAfter: OrderStatusEnum.DELIVERED,
        },
      });
      this.eventEmitter.emit('order.delivered', {
        orderId: order._id,orderNumber: order.orderNumber,userId: order.createdBy,
        paymentMethod: order.paymentMethod,deliveredAt: orderUpdates.deliveredAt,
      });
      await this.redis.clearCacheKey({key : CacheKeyEnum.ORDER , userId : order.createdBy as Types.ObjectId , extra: order._id})
      return {message : `Order #${order.orderNumber} marked as delivered successfully`}
    } catch (error) {
      await session.abortTransaction()
      throw new BadRequestException(error)
    } finally {
      await session.endSession()
    }
  }

  async refundOrderRequest(orderId: Types.ObjectId,user: HUserDocument,{items,refundReason,refundReasonOther}:RefundOrderRequestArgs): Promise<{message : string}> {
    const session = await this.dataBaseService.startSession();
    try {
      session.startTransaction();
      if (!items.length) {
        throw new BadRequestException('Refund items are required');
      }
      const settings = await this.settingsRepository.findOne({filter: {},options: { session }});
      const returnPolicyDays = settings?.returnPolicyDays ?? 14;
      const order = await this.orderRepository.findOne({filter: {_id: orderId,
        paymentStatus: {$in: [PaymentStatusEnum.PAID, PaymentStatusEnum.PARTIALLY_REFUNDED]},
        status: { $in: [OrderStatusEnum.DELIVERED,  OrderStatusEnum.PARTIALLY_RETURNED]}},options: { session },
      });
      if (!order) {
        throw new NotFoundException('Order not found or not eligible for return');
      }
      if (!order.deliveredAt) {
        throw new BadRequestException('Order has not been marked as delivered yet');
      }
      const expiresToRefund = new Date(order.deliveredAt.getTime() +returnPolicyDays * 24 * 60 * 60 * 1000,);
      if (new Date() > expiresToRefund) {
        throw new BadRequestException(`The return period of ${returnPolicyDays} days has expired on ${expiresToRefund.toISOString().split('T')[0]}`);
      }
      const orderItemsMap = new Map(order.items.map((item) => [item.variantId.toString(), item]));
      const seen = new Set<string>();
      for (const item of items) {
        const variantId = item.variantId.toString();
        if (seen.has(variantId)) {
          throw new BadRequestException(`Duplicate variant ${variantId}`);
        }
        seen.add(variantId);
        const orderItem = orderItemsMap.get(variantId);
        if (!orderItem) {
          throw new BadRequestException(`Product ${variantId} was not part of this order`);
        }
        const alreadyRefunded = orderItem.refundedQuantity ?? 0;
        const availableToRefund = orderItem.quantity - alreadyRefunded;
        if (item.refundedQuantity <= 0) {
          throw new BadRequestException('Refund quantity must be greater than zero');
        }
        if (item.refundedQuantity > availableToRefund) {
          throw new BadRequestException(`Cannot refund ${item.refundedQuantity} items for ${orderItem.skuSnapshot}. Max returnable is ${availableToRefund}`);
        }
        orderItem.requestReturnQuantity = item.refundedQuantity;
      }

      const updatedOrder =await this.orderRepository.findOneAndUpdate({
        filter: {
          _id: orderId,paymentStatus: {$in: [PaymentStatusEnum.PAID, PaymentStatusEnum.PARTIALLY_REFUNDED]},
          status: { $in: [OrderStatusEnum.DELIVERED, OrderStatusEnum.PARTIALLY_RETURNED]}},
        update: {
          items: [...orderItemsMap.values()], status: OrderStatusEnum.RETURN_REQUESTED,
          paymentStatus: PaymentStatusEnum.REFUND_REQUESTED,refundReason,
          refundReasonOther:refundReason === RefundResoneEnum.OTHER? refundReasonOther: null,
        },options: {session,returnDocument: 'after'},
      });
      if (!updatedOrder)throw new NotFoundException('Failed to update order' )
      const payment =await this.paymentRepository.findOneAndUpdate({filter: {orderId,paidAt: { $exists: true },status: PaymentStatusEnum.PAID},
        update: {status: PaymentStatusEnum.REFUND_REQUESTED,updatedBy: user._id},options: {session}});
      if (!payment) {
        throw new NotFoundException('This order payment not found');
      }
      await session.commitTransaction();
      this.eventEmitter.emit('audit-log.create', {
        action: LogActionEnum.REFUND_REQUEST,isSystem: false,
        referenceId: order._id,referenceModel: ReferenceModelEnum.ORDER,
        actorId: user._id,
        metadata: {
          requestedItems: items, reason: refundReason, refundReasonOther:refundReason === RefundResoneEnum.OTHER ? refundReasonOther: null,
        },
      });
      this.eventEmitter.emit('order.refund_requested', {
        orderId: order._id,orderNumber: order.orderNumber,
        recipientId: user._id,items,reason: refundReason,
        refundReasonOther: refundReason === RefundResoneEnum.OTHER? refundReasonOther: null,
      });
      await this.redis.clearCacheKey({key: CacheKeyEnum.ORDER,userId: order.createdBy as Types.ObjectId,extra: order._id});
      return {message : 'Your refund request has been sent successfully.'};
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async rejectRefundRequest(orderId: Types.ObjectId , user : HUserDocument , {rejectionReason , rejectReasonOther} : RejectRefundArgs) : Promise<{message : string}>{
    const session = await this.dataBaseService.startSession()
    try {
      session.startTransaction()
      const order = await this.orderRepository.findOne({filter : {_id : orderId , status : OrderStatusEnum.RETURN_REQUESTED , paymentStatus : PaymentStatusEnum.REFUND_REQUESTED} , options : {session}})
      if(!order) throw new NotFoundException(`Order not found or not in return requested status`)

      const resetOrderItems = order.items.map((item)=> ({...item , requestReturnQuantity : 0}))
      const hasPerviousRefunds = resetOrderItems.some(item => (item.refundedQuantity ||0) > 0)

      const orderStatus = hasPerviousRefunds ? OrderStatusEnum.PARTIALLY_RETURNED : OrderStatusEnum.DELIVERED
      const orderPaymentStatus = hasPerviousRefunds ? PaymentStatusEnum.PARTIALLY_REFUNDED : PaymentStatusEnum.PAID

      const updatedOrder = await this.orderRepository.findOneAndUpdate({filter: { _id: orderId },
        update: { items: resetOrderItems,status: orderStatus , paymentStatus: orderPaymentStatus},
        options: { session, returnDocument: 'after' },
      });
      if (!updatedOrder) throw new BadRequestException('Failed to reject refund request');
      await this.paymentRepository.findOneAndUpdate({
        filter: { orderId, status: PaymentStatusEnum.REFUND_REQUESTED },
        update: { status: orderStatus,updatedBy: user._id},options: { session },
      });

      await session.commitTransaction();
      
      this.eventEmitter.emit('audit-log.create', {
        action: LogActionEnum.REFUND_REJECTED, isSystem: false,referenceId: order._id,
        referenceModel: ReferenceModelEnum.ORDER, actorId: user._id,
        metadata: {
          orderNumber: order.orderNumber,rejectionReason,orderStatus,orderPaymentStatus,notes: rejectReasonOther || null
        },
      });
      this.eventEmitter.emit('order.refund_rejected', {
        orderId: order._id,orderNumber: order.orderNumber,
        userId: order.createdBy,rejectionReason,rejectReasonOther: rejectReasonOther || null,
      });
      await this.redis.clearCacheKey({key : CacheKeyEnum.ORDER , userId : order.createdBy as Types.ObjectId  , extra : order._id})
      return {message : `Refund request for order #${order.orderNumber} rejected successfully`};
    } catch (error : any) {
      await session.abortTransaction()
      throw new BadRequestException(error.message || error);
    }finally {
      await session.endSession()
    }
  }

  async refundOrder(orderId: Types.ObjectId , user : HUserDocument , {cashMethod ,receiptUrl} : RefundArgs): Promise<{message : string}>{
    const session = await this.dataBaseService.startSession()
    let stripeRefundData: string | null = null;
    try {
      session.startTransaction()
      const order = await this.orderRepository.findOne({filter : {
      _id : orderId , status : OrderStatusEnum.RETURN_REQUESTED , paymentStatus : PaymentStatusEnum.REFUND_REQUESTED},options:{session}
      })
      if(!order) throw new NotFoundException(`Order not found or return requested status`)
      let actualRefundAmount = 0
      let totalCogsInBaseCurrency = 0
      
      const invIds = order.items.map(item => item.variantId)
      const warIds = order.items.map(item => item.warehouseId)
      const inventories = await this.inventoryRepository.find({filter : {productVariantId : {$in : invIds} , wareHouseId : {$in : warIds}}, options : {session}})

      if (inventories.length !== invIds.length) {
        throw new NotFoundException("Some inventory items not found")
      }
      const wareIds = inventories.map(war => war.wareHouseId)
      const warehouses = await this.wareHouseRepository.find({filter : {_id : {$in : wareIds as Types.ObjectId[]}} , options : {session}})
      if (!warehouses.length) throw new NotFoundException("warehouses not found")

      const inventoryMap = new Map(inventories.map(inv => [inv.productVariantId.toString() , inv]))
      const wareHouseMap = new Map(warehouses.map(ware => [ware._id.toString() , ware]))

      const inventoryUpdates = []
      const productVariantUpdates = [];
      const stockChangePayloads : any = []
      const movements : any = []
      const updatedOrderItems = [...order.items]
      for (const item of order.items) {
        const qtyToReturn = item.requestReturnQuantity || 0
        if(qtyToReturn <= 0) continue

        const inventory = inventoryMap.get(item.variantId.toString())
        if(!inventory) throw new NotFoundException(`Inventory not found`)

        const warehouse = wareHouseMap.get(inventory.wareHouseId.toString())
        if(!warehouse) throw new NotFoundException(`Warehouse not found in inventory ${inventory.skuSnapshot}`)
        
        actualRefundAmount += item.priceSnapshot * qtyToReturn
        totalCogsInBaseCurrency += inventory.costPrice * qtyToReturn

        item.refundedQuantity = (item.refundedQuantity || 0) + qtyToReturn
        item.requestReturnQuantity = 0

        const beforeQuantity = inventory.quantity
        const afterQuantity = beforeQuantity + qtyToReturn

        inventoryUpdates.push(this.inventoryMovementService.buildInventoryUpdateOrderStatus({inventory ,quantity : qtyToReturn , type : 'refund'}))
        movements.push(this.inventoryMovementService.buildInventoryMovementOrder({
          inventory , warehouse , afterQuantity , beforeQuantity , createdBy : user._id,
          item , referenceId : order._id , referenceModel : ReferenceModelEnum.ORDER  , type : InventoryMovementType.RETURN
        }))

        productVariantUpdates.push(this.adjustStockService.adjustStock({
        productVariantId : item.variantId , quantityChange : qtyToReturn , type : 'inc'
        }))
        const previousAvailable = inventory.availableQuantity;
        const newAvailable = previousAvailable + qtyToReturn;
        stockChangePayloads.push({
          inventoryId: inventory._id.toString(), productVariantId: item.variantId.toString(),
          sku: inventory.skuSnapshot , warehouseId: inventory.wareHouseId.toString(),
          previousAvailableQuantity: previousAvailable,newAvailableQuantity: newAvailable,
          lowStockThreshold: inventory.lowStockThreshold,actionType: ActionStockTypeEnum.ORDER_REFUND,
        } as IStockChangedPayload);
      }
      if(actualRefundAmount <= 0){
        throw new BadRequestException('No items were requested for return');
      }
      const updateInventory = await this.inventoryRepository.bulkWrite(inventoryUpdates, { ordered: true, session: session });
      if(!updateInventory.matchedCount) throw new BadRequestException("Fail to update inventory")
      const updateProductVrainat = await this.productVariantRepository.bulkWrite(productVariantUpdates, { ordered: true, session : session });
      if(!updateProductVrainat.matchedCount) throw new BadRequestException("Fail to update inventory")
      const updateMovement =  await this.inventoryMovementRepository.create({data : movements, options :{ ordered: true, session: session }});
      if(!updateMovement) throw new BadRequestException("Fail to update Movements")
      const isAllReturned = updatedOrderItems.every(item => (item.refundedQuantity || 0) >= item.quantity)
      const finalOrderStatus = isAllReturned ? OrderStatusEnum.RETURNED : OrderStatusEnum.PARTIALLY_RETURNED
      const finalPaymentStatus = isAllReturned ? PaymentStatusEnum.REFUNDED : PaymentStatusEnum.PARTIALLY_REFUNDED
      const refundType = isAllReturned ? RefundTypeEnum.FULL : RefundTypeEnum.PARTIAL
      const paymentUpdate = { status: PaymentStatusEnum.REFUNDED, updatedBy: user._id, refundedAmount: actualRefundAmount };
      const payment = await this.paymentRepository.findOneAndUpdate({
        filter: { orderId, paidAt: { $exists: true }, status: PaymentStatusEnum.REFUND_REQUESTED },
        update: paymentUpdate,
        options: { session }
      });
      if (!payment) throw new NotFoundException(`This order payment not found`);
      if (isAllReturned && order.couponId) {
        await this.couponRepository.findOneAndUpdate({filter : {_id : order.couponId}, update : {$inc : {usedCount : -1}} , options : {session}})
      }
      const updateOrder = await this.orderRepository.findOneAndUpdate({filter : {
        _id : orderId , status : OrderStatusEnum.RETURN_REQUESTED , paymentStatus : PaymentStatusEnum.REFUND_REQUESTED},
        update : {items : updatedOrderItems , status  :finalOrderStatus, refundedAt : new Date() , refundType , paymentStatus : finalPaymentStatus , $inc : {refundAmount : actualRefundAmount}},options:{session , returnDocument :"after"}
      })
      if(!updateOrder) throw new NotFoundException("Fail to refund order")
      const financialReviewExist = await this.financialReviewRepository.findOne({filter : {referenceId : order._id , referenceModel : ReferenceModelEnum.ORDER , source : FinancialSourceEnum.ORDER}})
      if(!financialReviewExist) throw new NotFoundException(`Financial review not found`)
      const financialReview = await this.financialReviewRepository.createOne({
        data : {
          amount : actualRefundAmount , category : FinancialCategoryEnum.REFUND , currency :  order.currency.toUpperCase() ,
          isSystem : false , discountAmountSnapshot : order.discountAmount , referenceId : order._id,
          referenceModel : ReferenceModelEnum.ORDER , source : FinancialSourceEnum.ORDER , createdBy : user._id,
          shippingCostSnapshot : order.shippingAmount , costOfGoodsSold : financialReviewExist.costOfGoodsSold || 0,
          notes : `Refund processed (${refundType}) for Order #${order.orderNumber}. Reason: ${order.refundReason}. Refunded Amount: ${actualRefundAmount} ${order.currency}. Stripe Refund ID: ${stripeRefundData || 'N/A'}.`
      } ,options : {session, ordered : true}})
      if(!financialReview) throw new BadRequestException(`Fail to create financial review for this order ${order._id.toString()}`)
      const isCard = order.paymentMethod === PaymentMethodEnum.CARD
      if (isCard && order?.intentId) {
        try {
          const refund = refundType === RefundTypeEnum.PARTIAL ? await this.paymentService.refund(order.intentId,actualRefundAmount)
            : await this.paymentService.refund(order.intentId);
          stripeRefundData = refund.id;
        } catch (stripeErr: any) {
          console.error('❌ Stripe Refund Failed:', stripeErr);
        }
      }
      await session.commitTransaction();
      for (const payload of stockChangePayloads) {
        this.eventEmitter.emit('inventory.stock_changed', payload);
      }
      this.eventEmitter.emit('audit-log.create', {
          action: LogActionEnum.REFUND, isSystem: isCard ? true : false, referenceId: order._id,
          referenceModel: ReferenceModelEnum.ORDER, actorId: user._id,
          metadata: {
            orderNumber: order.orderNumber, refundedAmount: actualRefundAmount, paymentMethod: order.paymentMethod,
            statusBefore : OrderStatusEnum.RETURN_REQUESTED, statusAfter : OrderStatusEnum.RETURNED, 
            ...(isCard ? { refundType: 'AUTOMATIC_STRIPE_GATEWAY', stripeRefundId: stripeRefundData} : 
              { refundType: 'MANUAL_CASH_RETURN', cashReturnMethod: cashMethod || CashReturnMethodEnum.HAND_BY_HAND,
                receiptPhoto: receiptUrl || null
              }),
            refundType,
            refundAmount : actualRefundAmount
          }
      });
      this.eventEmitter.emit('order.refunded', {
        orderId: order._id,orderNumber: order.orderNumber,
        userId: order.createdBy,refundedAmount: actualRefundAmount,
        currency: order.currency,refundType,paymentMethod: order.paymentMethod,
      });
      this.eventEmitter.emit('financial.review.created', {
        financialReviewId: financialReview._id, category: FinancialCategoryEnum.REFUND,
        source: FinancialSourceEnum.ORDER,amount: actualRefundAmount,
        currency: order.currency.toUpperCase(), referenceId: order._id,
        referenceModel: ReferenceModelEnum.ORDER, orderNumber: order.orderNumber,
        refundType,refundReason: order.refundReason, stripeRefundId: stripeRefundData || 'N/A',actorId: user._id,
      });
      await this.redis.clearCacheKey({key : CacheKeyEnum.ORDER , userId : order.createdBy as Types.ObjectId , extra: order._id})
      return {message : `Order ${updateOrder.orderNumber} refunded successfuly`};
      } catch (error : any) {
        await session.abortTransaction()
        throw new BadRequestException(error.message)
      } finally {
        await session.endSession()
      }
  }

  async findAll(query : AllOrdersDTO  ):Promise<IPagination<IOrder>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , search , paymentMethod , paymentStatus , status  } = query || {};
    const sortOption = OrderSortEnum[sort] || OrderSortEnum[SortEnum.NEWEST]
    const orders = await this.orderRepository.paginate({filter : {
      ...(search && {orderNumber : new RegExp(search , 'i')}),
      ...(paymentMethod && {paymentMethod}),
      ...(paymentStatus && {paymentStatus}),
      ...(status && {status}),
    } , 
      limit , page , sort : sortOption , projection : "status items orderNumber paymentStatus  paymentMethod currency totalAmount" , options : {populate : [{path : "createdBy" , select : "firstName lastName"}]}})
    return orders;
  }

  async findOne(orderId: Types.ObjectId , user : HUserDocument):Promise<IOrder> {
    if (user.role === RoleEnum.USER) {
      const order = await this.orderRepository.findOne({filter : {_id : orderId} , projection : "-intentId -stripeSessionUrl -stripeSessionId -couponId -confirmedBy -canceledBy -canceledBySystem -updatedBy -createdBy"})
      if (!order) {
        throw new NotFoundException("Order not found")
      }
      return order
    }else {
      const order = await this.orderRepository.findOne({filter : {_id : orderId} , options : {
        populate : [
          {path : "createdBy" , select : "firstName lastName role email phone address"} ,
          {path : "items.variantId" , populate : [
            {path : "categoryId" , select : "image name"} ,
            {path : "brandId" , select : "logo name"} , 
            {path : "productId"}]} ,
          {path : "items.warehouseId"}
        ]}})
      if (!order) {
        throw new NotFoundException("Order not found")
      }
      return order
    }
  }
}
