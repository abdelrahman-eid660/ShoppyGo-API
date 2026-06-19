export enum RefundStatusEnum {
  REQUESTED = 'requested',   // العميل طلب refund
  PENDING = 'pending',       // تحت المراجعة
  APPROVED = 'approved',     // تم الموافقة
  REJECTED = 'rejected',     // تم الرفض
  PROCESSING = 'processing', // جاري تنفيذ الإرجاع (Payment gateway)
  COMPLETED = 'completed',   // تم رجوع الفلوس فعليًا
  FAILED = 'failed',         // فشل تنفيذ الاسترجاع
  CANCELLED = 'cancelled',   // العميل لغى الطلب
}