export enum ReferenceModelEnum {
  PURCHASE_PRODUCTS = "PurchaseProducts",
  ORDER = "Order",
  REFUND = "Refund",
  TRANSFER = "WareHouseTransform",
  WAREHOUSE = "WareHouse",
  STOCK_ADJUSTMENT = "StockAdjustment",
  INITIAL_STOCK = "initial_stock",
  PAYMENT = 'Payment',
  INVENTORY = 'Inventory',
  COUPON = 'Coupon',
  PRODUCT_VARIANT = 'ProductVariant',
  PRODUCT = 'Product',
  CART = 'Cart',
  BRAND = 'Brand',
  CATEGORY = 'Category',
  SUPPLIER = 'Supplier',
  BRAND_SUPPLIER = 'BrandSupplier',
  PRODUCT_SUPPLIER = 'ProductSupplier',
  SHIPPING_ZONE = 'ShippingZone',
  SETTINGS = 'Settings',
  REVIEW = 'Review',
  FINANCIAL_REVIEW = 'FinancialReview',
}
export enum InventoryMovementType {
  PURCHASE = "purchase",
  SALE = "sale",
  ORDER = "ORDER",
  RETURN = "return",
  TRANSFER_IN = "transfer_in",
  TRANSFER_OUT = "transfer_out",
  ADJUSTMENT = "adjustment",
  DAMAGED = "damaged",
  EXPIRED = "expired",
}
export enum OperationEnum {
  INCREAS = "increase",
  DECREASE = "decrease"
}