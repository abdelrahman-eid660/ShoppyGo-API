import { Types } from 'mongoose';
import { SharedCurrencyEnum, FinancialCategoryEnum, FinancialSourceEnum, ReferenceModelEnum } from '../enum';
import { IWareHouse } from './warehouse.interface';
import { IUser } from './user.interface';

export interface IFinancialReview {
  _id: Types.ObjectId;
  warehouseId: Types.ObjectId | IWareHouse;
  
  referenceId: Types.ObjectId; 
  referenceModel: ReferenceModelEnum;

  category: FinancialCategoryEnum; // إيراد، مصروف، خسارة، مرتجع
  source: FinancialSourceEnum;     // أوردر، شراء، جرد، مصاريف عامة
  
  amount: number;                  // القيمة المالية للحركة
  currency: SharedCurrencyEnum;                // EGP
  
  // Snapshots ومؤشرات محاسبية للتحليل
  costOfGoodsSold?: number;        // تكلفة البضاعة المباعة (سعر شراء المنتج الأصلي x الكمية)
  shippingCostSnapshot?: number;   // تكلفة الشحن الفردية
  discountAmountSnapshot?: number; // قيمة الخصومات بالكوبونات
  
  createdBy: Types.ObjectId | IUser;
  isSystem?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}