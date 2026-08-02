import { registerEnumType } from "@nestjs/graphql";

export enum OrderStatusEnum {
  PENDING = 'pending', // الطلب اتعمل ولسه ما اتراجعش
  CONFIRMED = 'confirmed', // تم تأكيد الطلب
  DELIVERED = 'delivered', // تم التسليم
  CANCELLED = 'cancelled', // تم إلغاء الطلب
  RETURNED = 'returned', // تم إرجاع الطلب
  FAILED = 'failed', // فشل تنفيذ الطلب
  RETURN_REQUESTED = 'return_request', // طلب الغاء الاوردر
  SHIPPED = 'shipped',
  PARTIALLY_RETURNED = 'partially_returned'
}
export enum OrderCodeResponse {
  'orderCreated' = 'Order placed successfully',
  'orderCancelled' = 'Order cancelled successfully',
  'orderDelivered' = 'Order delivered successfully',
  'orderNotFound' = 'Order not found',
}
export enum CurrencyEnum {
  EGP = "egp",
  USD = "usd"
}

export enum CancelReasonEnum {
  CUSTOMER_CHANGED_MIND = "customer_changed_mind",
  ORDER_PLACED_BY_MISTAKE = "order_placed_by_mistake",
  FOUND_BETTER_PRICE = "found_better_price",
  DELIVERY_TAKING_TOO_LONG = "delivery_taking_too_long",
  SHIPPING_COST_TOO_HIGH = "shipping_cost_too_high",
  PAYMENT_FAILED = "payment_failed",
  DUPLICATE_ORDER = "duplicate_order",
  OUT_OF_STOCK = "out_of_stock",
  SELLER_UNABLE_TO_FULFILL = "seller_unable_to_fulfill",
  INCORRECT_SHIPPING_ADDRESS = "incorrect_shipping_address",
  PRODUCT_NO_LONGER_NEEDED = "product_no_longer_needed",
  FRAUD_SUSPECTED = "fraud_suspected",
  OTHER = "other",
}
export enum RefundResoneEnum {
  DAMAGED_PRODUCT = "damaged_product",
  DEFECTIVE_PRODUCT = "defective_product",
  WRONG_ITEM_RECEIVED = "wrong_item_received",
  MISSING_ITEMS = "missing_items",
  ITEM_NOT_AS_DESCRIBED = "item_not_as_described",
  QUALITY_NOT_AS_EXPECTED = "quality_not_as_expected",
  SIZE_OR_VARIANT_ISSUE = "size_or_variant_issue",
  LATE_DELIVERY = "late_delivery",
  ORDER_NOT_RECEIVED = "order_not_received",
  DUPLICATE_PAYMENT = "duplicate_payment",
  CUSTOMER_REQUEST = "customer_request",
  CANCELLED_ORDER = "cancelled_order",
  FRAUD_SUSPECTED = "fraud_suspected",
  OTHER = "other",
}

export enum RefundTypeEnum  {
  FULL = 'full',
  PARTIAL = 'partial'
}

export enum RejectionReasonEnum {
  EXPIRED_POLICY = 'expired_policy',
  NOT_DELIVERED_YET = 'not_delivered_yet',

  ITEM_DAMAGED_BY_CUSTOMER = 'item_damaged_by_customer',
  MISSING_TAGS_OR_PACKAGING = 'missing_tags_or_packaging',
  ITEM_USED_OR_ALTERED = 'item_used_or_altered',
  NON_RETURNABLE_ITEM = 'non_returnable_item',

  INSUFFICIENT_EVIDENCE = 'insufficient_evidence',
  INVALID_REASON = 'invalid_reason',
  PRICE_DIFFERENCE = 'price_difference',

  OTHER = 'other',
}