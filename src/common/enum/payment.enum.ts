export enum ProviderPaymentEnum {
  STRIPE = 'stripe',
  PAYMOB = 'paymob',
}
export enum PaymentCodeResponse {
  'paymentSuccess' = 'Payment completed successfully',
  'paymentFailed' = 'Payment failed',
  'refundSuccess' = 'Refund completed successfully',
  'invalidPaymentMethod' = 'Invalid payment method',
}
export enum PaymentStatusEnum {
  PENDING = 'pending', // الدفع بدأ ولسه ما اكتملش
  PROCESSING = 'processing', // جاري تنفيذ الدفع (gateway)
  AUTHORIZED = 'authorized', // تم حجز الفلوس لكن لم تُسحب بعد
  PAID = 'paid', // تم الدفع بنجاح
  FAILED = 'failed', // فشل الدفع
  CANCELLED = 'cancelled', // تم إلغاء عملية الدفع

  REFUND_REQUESTED = 'refund_requested', // طلب استرجاع
  REFUNDED = 'refunded', // تم استرجاع الفلوس
  PARTIALLY_REFUNDED = 'partially_refunded', // استرجاع جزئي
}
