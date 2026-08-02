import { Types } from 'mongoose';
import { CurrencyEnum } from '../enum';

export interface ICurrencyItem {
  code: string;
  name?: string;
  exchangeRate: number;
  updatedAt: Date;
}

export interface ICurrencyRate {
  baseCurrency: CurrencyEnum;
  currencies: ICurrencyItem[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}