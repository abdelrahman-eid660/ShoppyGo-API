import { NotFoundException } from "@nestjs/common";
import { ISettings } from "../interface";
import { SharedCurrencyEnum } from "../enum";

export const convertAmountToBaseCurrency = (amount: number, currency: SharedCurrencyEnum,settings: ISettings): number =>  {
  if (settings.baseCurrency === currency) return amount;
  const rate = settings.currencies?.find((c: any) => c.code === currency);
  if (!rate || rate.exchangeRate <= 0) {
    throw new NotFoundException(
      `System does not support exchange rate for currency: ${currency}`,
    );
  }
  return amount / rate.exchangeRate;
}