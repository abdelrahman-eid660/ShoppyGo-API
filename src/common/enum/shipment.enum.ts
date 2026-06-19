export enum ShipmentStatusEnum {
  PENDING = 'pending',           // لسه الطلب مستني يتشحن
  PACKED = 'packed',             // تم تغليف الطلب
  SHIPPED = 'shipped',           // خرج من المخزن
  IN_TRANSIT = 'in_transit',     // في الطريق
  OUT_FOR_DELIVERY = 'out_for_delivery', // مع المندوب
  DELIVERED = 'delivered',       // وصل للعميل
  FAILED = 'failed',             // فشل التوصيل
  RETURNED = 'returned',         // رجع للمخزن
  CANCELLED = 'cancelled',       // تم إلغاء الشحن
}