export enum SortEnum {
  NEWEST = "newest",
  OLDEST = "oldest",
  NAME_ASC = "name_asc",
  NAME_DESC = "name_desc",
  CODE_ASC = "code_asc",
  CODE_DESC = "code_desc",
  PRICE_ASC = "price_asc",
  PRICE_DESC = "price_desc",
  DISCOUNTAMOUNT_ASC = "discountAmount_asc",
  DISCOUNTAMOUNT_DESC = "discountAmount_desc",
  REFUND_AMOUNT_ASC = "refund_amount_asc",
  REFUND_AMOUNT_DESC = "refund_amount_desc",
  COUPON_VALUE_ASC = "coupon_value_asc",
  COUPON_VALUE_DESC = "coupon_value_desc",
  MINORDERQUANTITY_ASC = "minOrderQuantity_asc",
  MINORDERQUANTITY_DESC = "minOrderQuantity_desc",
  SKU_ASC = "sku_asc",
  SKU_DESC = "sku_desc",
  TITLE_ASC = "title_asc",
  TITLE_DESC = "title_desc",
  UPDATED_DESC = "updated_desc",
}
export const SharedSortEnum : Record<string , any> = {
    [SortEnum.NEWEST] : {_id : -1},
    [SortEnum.OLDEST] : {_id : 1},    
    [SortEnum.UPDATED_DESC] : {updatedAt : -1 , _id : -1}
}
export const BrandSortEnum : Record<string , any> = {
    [SortEnum.NEWEST] : {_id : -1},
    [SortEnum.OLDEST] : {_id : 1},
    [SortEnum.NAME_DESC] : {name : -1 , _id : -1}, // name z-a
    [SortEnum.NAME_ASC] : {name : 1 , _id : 1}, // name a-z
    [SortEnum.UPDATED_DESC] : {updatedAt : -1 , _id : -1} // the lastes updates
}
export const BrandSupplierSortEnum : Record<string , any> = {
    [SortEnum.NEWEST] : {_id : -1},
    [SortEnum.OLDEST] : {_id : 1},
    [SortEnum.NAME_DESC] : {brandSupplierSnapshot : -1 , _id : -1}, // name z-a
    [SortEnum.NAME_ASC] : {brandSupplierSnapshot : 1 , _id : 1}, // name a-z
    [SortEnum.UPDATED_DESC] : {updatedAt : -1 , _id : -1} // the lastes updates
}
export const CategorySortEnum : Record<string , any>  = {
    [SortEnum.NEWEST] : {_id : -1},
    [SortEnum.OLDEST] : {_id : 1},
    [SortEnum.NAME_DESC] : {name : -1 , _id : -1}, // name z-a
    [SortEnum.NAME_ASC] : {name : 1 , _id : 1}, // name a-z
    [SortEnum.UPDATED_DESC] : {updatedAt : -1 , _id : -1} // the lastes updates
}
export const ProductSortEnum : Record<string , any>= {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.TITLE_ASC]: { title: 1 },
  [SortEnum.TITLE_DESC]: { title: -1 },

  [SortEnum.UPDATED_DESC]: { updatedAt: -1, _id: -1 }
};
export const ProductVariantSortEnum : Record<string , any>= {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.SKU_ASC]: { sku: 1 },
  [SortEnum.SKU_DESC]: { sku: -1 },

  [SortEnum.UPDATED_DESC]: { updatedAt: -1, _id: -1 }
};
export const InventorySortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.TITLE_ASC]: { productTitleSnapshot: 1 },
  [SortEnum.TITLE_DESC]: { productTitleSnapshot: -1 },

  [SortEnum.SKU_ASC]: { skuSnapshot: 1 },
  [SortEnum.SKU_DESC]: { skuSnapshot: -1 },

  [SortEnum.UPDATED_DESC]: { updatedAt: -1, _id: -1 }
};
export const SupplierSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.NAME_DESC] : {name : -1 , _id : -1}, 
  [SortEnum.NAME_ASC] : {name : 1 , _id : 1},

  [SortEnum.UPDATED_DESC]: { updatedAt: -1, _id: -1 }
};
export const ProductSupplierSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.PRICE_DESC] : {costPrice : -1 , _id : -1}, 
  [SortEnum.PRICE_ASC] : {costPrice : 1 , _id : 1},

  [SortEnum.MINORDERQUANTITY_DESC] : {minOrderQuantity : -1 , _id : -1}, 
  [SortEnum.MINORDERQUANTITY_ASC] : {minOrderQuantity : 1 , _id : 1},

  [SortEnum.UPDATED_DESC]: { updatedAt: -1, _id: -1 }
};
export const PurchaseProductSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.NAME_DESC] : {supplierNameSnapshot : -1 , _id : -1}, 
  [SortEnum.NAME_ASC] : {supplierNameSnapshot : 1 , _id : 1},

  [SortEnum.UPDATED_DESC]: { updatedAt: -1, _id: -1 }
};
export const WareHouseSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.NAME_DESC] : {name : -1 , _id : -1}, 
  [SortEnum.NAME_ASC] : {name : 1 , _id : 1},

  [SortEnum.UPDATED_DESC]: { updatedAt: -1, _id: -1 }
};
export const WareHouseTransformSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.NAME_DESC] : {productVariantNameSnapshot : -1 , _id : -1}, 
  [SortEnum.NAME_ASC] : {productVariantNameSnapshot : 1 , _id : 1},

  [SortEnum.UPDATED_DESC]: { updatedAt: -1, _id: -1 }
};
export const InventoryMovementSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.NAME_DESC] : {name : -1 , _id : -1}, 
  [SortEnum.NAME_ASC] : {name : 1 , _id : 1},

  [SortEnum.SKU_DESC] : {sku : -1 , _id : -1}, 
  [SortEnum.SKU_ASC] : {sku : 1 , _id : 1},

  [SortEnum.UPDATED_DESC]: { updatedAt: -1, _id: -1 }
};
export const StockAdjustmenSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.NAME_DESC] : {warehouseNameSnapshot : -1 , _id : -1}, 
  [SortEnum.NAME_ASC] : {warehouseNameSnapshot : 1 , _id : 1},

  [SortEnum.SKU_DESC] : {"items.skuSnapShot" : -1 , _id : -1}, 
  [SortEnum.SKU_ASC] : {"items.skuSnapShot" : 1 , _id : 1},

  [SortEnum.UPDATED_DESC]: { updatedAt: -1, _id: -1 }
};
export const CouponSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.CODE_DESC] : {code : -1 , _id : -1}, 
  [SortEnum.CODE_ASC] : {code : 1 , _id : 1},

  [SortEnum.COUPON_VALUE_DESC] : {value : -1 , _id : -1}, 
  [SortEnum.COUPON_VALUE_ASC] : {value : 1 , _id : 1},

  [SortEnum.UPDATED_DESC]: { updatedAt: -1, _id: -1 }
};
export const ShippingZoneSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.PRICE_DESC] : {price : -1 , _id : -1}, 
  [SortEnum.PRICE_ASC] : {price : 1 , _id : 1},
};

export const OrderSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.DISCOUNTAMOUNT_DESC] : {discountAmount : -1 , _id : -1}, 
  [SortEnum.DISCOUNTAMOUNT_ASC] : {discountAmount : 1 , _id : 1},

  [SortEnum.PRICE_DESC] : {totalPrice : -1 , _id : -1}, 
  [SortEnum.PRICE_ASC] : {totalPrice : 1 , _id : 1},
};
export const PaymentSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.REFUND_AMOUNT_DESC] : {refundedAmount : -1 , _id : -1}, 
  [SortEnum.REFUND_AMOUNT_ASC] : {refundedAmount : 1 , _id : 1},

  [SortEnum.PRICE_DESC] : {amount : -1 , _id : -1}, 
  [SortEnum.PRICE_ASC] : {amount : 1 , _id : 1},
};
export const ShipmentSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },

  [SortEnum.PRICE_DESC] : {codAmount : -1 , _id : -1}, 
  [SortEnum.PRICE_ASC] : {codAmount : 1 , _id : 1},
};
export const CurrencyRateSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },
};
export const FinancialSortEnum : Record<string , any> = {
  [SortEnum.NEWEST]: { _id: -1 },
  [SortEnum.OLDEST]: { _id: 1 },
  [SortEnum.PRICE_ASC]: { amount: 1 , _id : 1},
  [SortEnum.PRICE_DESC]: { amount: -1 , _id : -1 },

};