import { HttpService } from "@nestjs/axios";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { SharedCurrencyEnum } from "src/common/enum";
import { HSettingsDocument } from "src/DB/models";

@Injectable()
export class MainSettingsService{
    private exchangeRateAPI! : string
    constructor(
        private readonly httpService : HttpService,
        private readonly configService : ConfigService,
    ){
        this.exchangeRateAPI = this.configService.get<string>('EXCHANGE_RATE_API_URL')!
    }
    async changeBaseCurrency({newCurrency}:{newCurrency : string}){
        try {
            const resualt = await firstValueFrom(this.httpService.get(`${this.exchangeRateAPI}/${newCurrency}`))
            const rates = resualt.data?.rates
            if(!rates) throw new BadRequestException("Fail to fetch rates for this currency")
            return rates
        } catch (error) {
            throw new BadRequestException("Fail to fetch this currency from API ")
        }
    }
    async addSubCurrency({newCurrency , currentSettings}:{newCurrency : string , currentSettings : HSettingsDocument}){
        try {
            const resualt = await firstValueFrom(this.httpService.get(`${this.exchangeRateAPI}/${currentSettings.baseCurrency}`))
            const rate = resualt.data?.rates?.[newCurrency]
            if (!rate) {
                throw new BadRequestException(`This currency not supported`)
            }
            const exchangeRate = Number((1/rate).toFixed(2))
            return exchangeRate
        } catch (error) {
            throw new BadRequestException("Fail to connect with exchangeRate api.")
        }
    }
    async transformCurrency({currencyTarget , baseCurrency}:{currencyTarget : SharedCurrencyEnum , baseCurrency : SharedCurrencyEnum}){
        try {
            const resualt = await firstValueFrom(this.httpService.get(`${this.exchangeRateAPI}/${currencyTarget}`))
            const rate = resualt.data?.rates[baseCurrency]
            if(!rate)throw new NotFoundException(`currency ${currencyTarget} not supported this currency ${baseCurrency}`)
            return Number(rate.toFixed(2))
        } catch (error) {
            throw new BadRequestException("Fail to fetch this currency from API")
        }
    }
}