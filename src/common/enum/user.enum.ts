export enum GenderEnum {
  MALE = 'male',
  FEMALE = 'female',
}
export enum UserCodeResponse {
  'profileUpdated' = 'Profile updated successfully',
  'avatarUpdated' = 'Profile image updated successfully',
  'userDeleted' = 'User deleted successfully',
  'userBlocked' = 'User blocked successfully',
  'userUnblocked' = 'User unblocked successfully',
}
export enum ProviderEnum {
  SYSTEM,
  GOOGLE,
}
export enum RoleEnum {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  USER = 'user',
}
export enum PermissionEnum {
  BRAND_CREATE = 'brand_create',
  BRAND_UPDATE = 'brand_update',
  BRAND_DELETE = 'brand_delete',
  BRAND_VIEW = 'brand_view',

  PRODUCT_CREATE = 'product_create',
  PRODUCT_UPDATE = 'product_update',
  PRODUCT_DELETE = 'product_delete',
  PRODUCT_VIEW = 'product_view',

  CATEGORY_CREATE = 'category_create',
  CATEGORY_UPDATE = 'category_update',
  CATEGORY_DELETE = 'category_delete',
  CATEGORY_VIEW = 'category_view',

  ORDER_CREATE = 'order_create',
  ORDER_UPDATE = 'order_update',
  ORDER_CANCEL = 'order_cancel',
  ORDER_REFUND = 'order_refund',
  ORDER_VIEW = 'order_view',

  ACCOUNT_DELETE_SELF = 'account_delete_self',
  ACCOUNT_UPDATE_SELF = 'account_update_self',

  USER_VIEW = 'user_view',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  USER_BAN = 'user_ban',

  INVENTORY_VIEW = 'inventory_view',
  INVENTORY_UPDATE = 'inventory_update',

  REVIEW_CREATE = 'review_create',
  REVIEW_UPDATE = 'review_update',
  REVIEW_DELETE = 'review_delete',
  REVIEW_VIEW = 'review_view',

  COUPON_CREATE = 'coupon_create',
  COUPON_UPDATE = 'coupon_update',
  COUPON_DELETE = 'coupon_delete',
  COUPON_VIEW = 'coupon_view',

  CART_VIEW = 'cart_view',
  CART_ADD_ITEM = 'cart_add-item',
  CART_REMOVE_ITEM = 'cart_remove-item',
  CART_UPDATE_ITEM = 'cart_update-item',
  CART_CLEAR = 'cart_clear',

  PAYMENT_CREATE = 'payment_create', // initiate payment
  PAYMENT_VIEW = 'payment_view', // view transaction
  PAYMENT_REFUND = 'payment_refund', // refund money
  PAYMENT_CAPTURE = 'payment_capture', // confirm payment
  PAYMENT_CANCEL = 'payment_cancel', // cancel transaction

  REPORTS_VIEW = 'reports_view',

  REQUEST_REFUND = 'request_refund',

  SETTINGS_UPDATE = 'settings_update',
}
//=================== Roles Permissions ============================
export const RolePermissions: Record<RoleEnum, PermissionEnum[]> = {
  [RoleEnum.SUPERADMIN]: Object.values(PermissionEnum),
  [RoleEnum.ADMIN]: [
    PermissionEnum.PAYMENT_VIEW,
    PermissionEnum.PAYMENT_REFUND,

    PermissionEnum.PRODUCT_CREATE,
    PermissionEnum.PRODUCT_UPDATE,
    PermissionEnum.PRODUCT_DELETE,
    PermissionEnum.PRODUCT_VIEW,

    PermissionEnum.CATEGORY_CREATE,
    PermissionEnum.CATEGORY_UPDATE,
    PermissionEnum.CATEGORY_DELETE,
    PermissionEnum.CATEGORY_VIEW,

    PermissionEnum.ORDER_CREATE,
    PermissionEnum.ORDER_UPDATE,
    PermissionEnum.ORDER_CANCEL,
    PermissionEnum.ORDER_REFUND,
    PermissionEnum.ORDER_VIEW,

    PermissionEnum.USER_VIEW,
    PermissionEnum.USER_BAN,

    PermissionEnum.REVIEW_DELETE,
    PermissionEnum.REVIEW_VIEW,

    PermissionEnum.COUPON_CREATE,
    PermissionEnum.COUPON_UPDATE,
    PermissionEnum.COUPON_DELETE,
    PermissionEnum.COUPON_VIEW,

    PermissionEnum.INVENTORY_VIEW,
    PermissionEnum.INVENTORY_UPDATE,

    PermissionEnum.ACCOUNT_DELETE_SELF,
    PermissionEnum.ACCOUNT_UPDATE_SELF,

    PermissionEnum.SETTINGS_UPDATE,
  ],

  [RoleEnum.SUPERVISOR]: [
    PermissionEnum.PRODUCT_UPDATE,
    PermissionEnum.PRODUCT_VIEW,

    PermissionEnum.PAYMENT_VIEW,
    PermissionEnum.PAYMENT_REFUND,

    PermissionEnum.ORDER_UPDATE,
    PermissionEnum.ORDER_VIEW,

    PermissionEnum.REVIEW_VIEW,

    PermissionEnum.INVENTORY_VIEW,
    PermissionEnum.INVENTORY_UPDATE,

    PermissionEnum.ACCOUNT_DELETE_SELF,
    PermissionEnum.ACCOUNT_UPDATE_SELF,
  ],

  [RoleEnum.USER]: [
    PermissionEnum.PRODUCT_VIEW,

    PermissionEnum.CATEGORY_VIEW,

    PermissionEnum.REQUEST_REFUND,

    PermissionEnum.PAYMENT_CREATE,
    PermissionEnum.PAYMENT_VIEW,

    PermissionEnum.CART_VIEW,
    PermissionEnum.CART_ADD_ITEM,
    PermissionEnum.CART_REMOVE_ITEM,
    PermissionEnum.CART_UPDATE_ITEM,
    PermissionEnum.CART_CLEAR,

    PermissionEnum.ORDER_CREATE,
    PermissionEnum.ORDER_CANCEL,
    PermissionEnum.ORDER_VIEW,

    PermissionEnum.REVIEW_CREATE,
    PermissionEnum.REVIEW_UPDATE,
    PermissionEnum.REVIEW_DELETE,
    PermissionEnum.REVIEW_VIEW,

    PermissionEnum.ACCOUNT_DELETE_SELF,
    PermissionEnum.ACCOUNT_UPDATE_SELF,
  ],
};
/*
/********************************************************

SuperAdmin => ['*']

---------------------------------------------------------

Admin =>
[
 PRODUCT_*,
 CATEGORY_*,
 ORDER_*,

 USER_VIEW,
 USER_BAN,

 REVIEW_VIEW,
 REVIEW_DELETE,

 COUPON_*,

 INVENTORY_VIEW,
 INVENTORY_UPDATE,

 REPORTS_VIEW,
 SETTINGS_UPDATE
]

---------------------------------------------------------

Supervisor =>
[
 PRODUCT_VIEW,
 PRODUCT_UPDATE,

 ORDER_VIEW,
 ORDER_UPDATE,

 REVIEW_VIEW,

 INVENTORY_VIEW,
 INVENTORY_UPDATE
]

---------------------------------------------------------

User =>
[
 PRODUCT_VIEW,

 CATEGORY_VIEW,

 CART_VIEW,
 CART_ADD_ITEM,
 CART_REMOVE_ITEM,
 CART_UPDATE_ITEM,
 CART_CLEAR,

 ORDER_CREATE,
 ORDER_VIEW,
 ORDER_CANCEL,
 ORDER_REFUND,

 REVIEW_CREATE,
 REVIEW_UPDATE,
 REVIEW_DELETE,
 REVIEW_VIEW,

 USER_UPDATE,
 USER_DELETE
]

********************************************************/
