import { Types } from 'mongoose';
import { SharedCurrencyEnum } from 'src/common/enum';
import { ICurrencyItem } from 'src/common/interface';

export interface ISettings {
  projectName: string;
  logoUrl?: string;  
  baseCurrency: SharedCurrencyEnum;
  currencies: ICurrencyItem[];

  returnPolicyDays? : number
  
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}