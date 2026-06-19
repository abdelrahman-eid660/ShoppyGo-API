export enum OrderStatusEnum {
  PENDING = 'pending', // الطلب اتعمل ولسه ما اتراجعش
  CONFIRMED = 'confirmed', // تم تأكيد الطلب
  PROCESSING = 'processing', // جاري تجهيز الطلب
  PACKED = 'packed', // تم تغليف الطلب
  SHIPPED = 'shipped', // خرج للشحن
  OUT_FOR_DELIVERY = 'out_for_delivery', // مع المندوب
  DELIVERED = 'delivered', // تم التسليم

  CANCELLED = 'cancelled', // تم إلغاء الطلب
  RETURNED = 'returned', // تم إرجاع الطلب
  FAILED = 'failed', // فشل تنفيذ الطلب
}
export enum OrderCodeResponse {
  'orderCreated' = 'Order placed successfully',
  'orderCancelled' = 'Order cancelled successfully',
  'orderDelivered' = 'Order delivered successfully',
  'orderNotFound' = 'Order not found',
}
