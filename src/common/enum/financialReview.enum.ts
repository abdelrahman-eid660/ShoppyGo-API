export enum FinancialCategoryEnum {
  REVENUE = 'Revenue',       // إيرادات (مبيعات الأوردرات)
  EXPENSE = 'Expense',       // مصروفات (شراء منتجات، شحن، مستقبلاً إيجار/ضرائب)
  LOSS = 'Loss',             // خسائر (إهلاك، توالف في الجرد، سرقة)
  REFUND = 'Refund',         // مرتجعات (فلوس رجعت للعميل)
}

export enum FinancialSourceEnum {
  ORDER = 'Order',           // الحركة جاية من أوردر عميل (بيع أو مرتجع)
  PURCHASE = 'Purchase',     // حركة شراء منتجات جديدة للمخزن من مورد
  INVENTORY_AUDIT = 'Audit', // حركة ناتجة عن الجرد (توالف وإهلاك)
  OVERHEAD = 'Overhead',     // مصاريف عامة (شحن، إيجار، ضرائب لاحقاً)
}