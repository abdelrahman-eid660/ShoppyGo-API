export enum PaginationStatusEnum {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  RECEIVED = 'received',
  FAILED = 'failed',
  PROCESSING = 'processing', // جاري تنفيذ الدفع (gateway)
  AUTHORIZED = 'authorized', // تم حجز الفلوس لكن لم تُسحب بعد
  PAID = 'paid', // تم الدفع بنجاح
  REFUND_REQUESTED = 'refund_requested', // طلب استرجاع
  REFUNDED = 'refunded', // تم استرجاع الفلوس
  PARTIALLY_REFUNDED = 'partially_refunded', // استرجاع جزئي
  APPROVED = 'approved', // تم الموافقة
  REJECTED = 'rejected', // تم الرفض
  COMPLETED = 'completed', // تم رجوع الفلوس فعليًا
  SHIPPED = 'shipped',           // خرج من المخزن
}
