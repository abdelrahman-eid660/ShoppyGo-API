/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { ConfigService } from '@nestjs/config';
import { SettingsRepository } from './../../DB/Repository';
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { HUserDocument } from 'src/DB/models';
import { AddSubCurrencyDTO, ChangeBaseCurrencyDTO, ChangeLogoDTO, ChangeProjectNameDTO, ChangeReturnPolicyDaysDTO, RemoveSubCurrencyDTO } from './dto';
import { CacheKeyEnum, CurrencyEnum, LogActionEnum, ReferenceModelEnum } from 'src/common/enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService, S3Service } from 'src/common/service';
import { MainSettingsService } from 'src/common/service';
import { ICurrencyItem, ISettings } from 'src/common/interface';

@Injectable()
export class SettingsService implements OnApplicationBootstrap {
  private projectName! : string
  private readonly logger = new Logger(SettingsService.name);
  constructor(
    private readonly settingsRepository : SettingsRepository , 
    private readonly configService : ConfigService,
    private readonly eventEmitter : EventEmitter2,
    private readonly s3 : S3Service,
    private readonly mainSettingsService : MainSettingsService,
    private readonly redis : CacheService,
  ){
    this.projectName = this.configService.get<string>('APPLICATION_NAME')!
  }
  async onApplicationBootstrap() {
    this.logger.log('Checking system settings...');
    await this.create();
  }

  async create() : Promise<ISettings> {
    const settingsExist = await this.settingsRepository.findOne({filter : {}})
    if(settingsExist){
      this.logger.log('System settings already exist.');
      return settingsExist
    } 
    const settings = await this.settingsRepository.create({data : {baseCurrency : CurrencyEnum.EGP.toUpperCase(), projectName : this.projectName}}) 
    if(!settings) throw new BadRequestException("Fail to create settings")
    this.logger.log('✅ Default system settings created successfully!');
    this.eventEmitter.emit('audit-log.create', {
      isSystem : true,
      action: LogActionEnum.SETTINGS_CREATE,
      referenceId: settings._id,
      referenceModel: ReferenceModelEnum.SETTINGS,
      metadata: {
        baseCurrency : CurrencyEnum.EGP,
        projectName : this.projectName,
        note: 'System automated initialization'
      }
    });
    return settings
  }

  async findOne(): Promise<ISettings> {
    const settings = await this.settingsRepository.findOne({
      filter : {},
      options : {populate : [
        {path : "updatedBy" , select : "firstName lastName role email"}
      ]}})
    if(!settings) throw new NotFoundException(`Settings not exists`)
    return settings
  }

  async changeProjectName({projectName}: ChangeProjectNameDTO , user : HUserDocument): Promise<ISettings> {
    const settings = await this.settingsRepository.findOneAndUpdate({filter : {} , update : {$set : {projectName ,  updatedBy : user._id}} , options : {returnDocument : "before"}})
    if(!settings) throw new BadRequestException(`Fail to change projectName`)
    await this.redis.clearCacheKey({key : CacheKeyEnum.SETTINGS , isPublic : true})
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id, action: LogActionEnum.SETTINGS_UPDATE,
      referenceId: settings._id, referenceModel: ReferenceModelEnum.SETTINGS,
      metadata: {projectNameBefore : settings.projectName,projectNameAfter : projectName}
    });
    this.eventEmitter.emit('settings.branding.updated', {
      settingsId: settings._id, projectName: projectName ?? settings.projectName, actorId: user._id,
    });
    return settings
  }

  async changeLogo({logoUrl}: ChangeLogoDTO , user : HUserDocument) : Promise<ISettings>{
    const settings = await this.settingsRepository.findOneAndUpdate({filter : {} , update : {$set : {logoUrl ,  updatedBy : user._id}} , options : {returnDocument : "before"}})
    const oldLogo = settings?.logoUrl
    if(oldLogo && oldLogo !== logoUrl){
      void this.s3.deleteAsset({Key : oldLogo})
    }
    if(!settings) throw new BadRequestException(`Fail to change logo`)
    await this.redis.clearCacheKey({key : CacheKeyEnum.SETTINGS , isPublic : true})
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.SETTINGS_UPDATE,
      referenceId: settings._id,referenceModel: ReferenceModelEnum.SETTINGS,
      metadata: { logoUrlBefore : settings.logoUrl || '', logoUrlAfter : logoUrl}
    });
    this.eventEmitter.emit('settings.branding.updated', {settingsId: settings._id,logoUrl: logoUrl ?? settings.logoUrl, actorId: user._id});
    return settings
  }

  async changeReturnPolicyDays({returnPolicyDays}: ChangeReturnPolicyDaysDTO , user : HUserDocument): Promise<ISettings> {
    const settings = await this.settingsRepository.findOneAndUpdate({filter : {} , update : {$set : {returnPolicyDays ,  updatedBy : user._id}} , options : {returnDocument : "before"}})
    if(!settings) throw new BadRequestException(`Fail to change logo`)
    await this.redis.clearCacheKey({key : CacheKeyEnum.SETTINGS , isPublic : true})
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.SETTINGS_UPDATE,
      referenceId: settings._id,referenceModel: ReferenceModelEnum.SETTINGS,
      metadata: {
        returnPolicyDaysBefore : settings.returnPolicyDays || 0,
        returnPolicyDaysAfter : returnPolicyDays
      }
    });
    this.eventEmitter.emit('settings.return_policy.updated', {
      settingsId: settings._id, returnPolicyDaysBefore: settings.returnPolicyDays || 0,
      returnPolicyDaysAfter: returnPolicyDays,actorId: user._id,
    });
    return settings
  }

  async changeBaseCurrency({ baseCurrency }: ChangeBaseCurrencyDTO, user : HUserDocument): Promise<ISettings> {
    const baseCurrencyExsits = await this.settingsRepository.findOne({filter : {baseCurrency}})
    if(baseCurrencyExsits) throw new ConflictException(`${baseCurrency} already applied`)
    const settings = await this.settingsRepository.findOne({ filter: {} });
    if (!settings) throw new NotFoundException("Settings not exists");
    
    const newRates = await this.mainSettingsService.changeBaseCurrency({ newCurrency: baseCurrency });
    const updatedCurrencies: ICurrencyItem[] = [];
    const oldBaseRate = newRates[settings.baseCurrency];
    if (oldBaseRate) {
      updatedCurrencies.push({
        code: settings.baseCurrency,
        name: "Old Main Currency",
        exchangeRate: Number(oldBaseRate.toFixed(2)),
        updatedAt: new Date()
      });
    }
    for (const currency of settings.currencies) {
      if (currency.code === baseCurrency) continue;
      const rate = newRates[currency.code];
      if (rate) {
        updatedCurrencies.push({ code: currency.code, name: currency.name, exchangeRate: Number(rate.toFixed(2)),updatedAt: new Date()});
      } else {
        throw new BadRequestException(`This currency don't support ${currency.code} rate`)
      }
    }
    const editCurrencies = await this.settingsRepository.findOneAndUpdate({filter: {},
      update: { $set: { baseCurrency, currencies: updatedCurrencies,updatedBy: user._id}},
      options: { returnDocument: "before" }
    });
    if (!editCurrencies) throw new NotFoundException("Settings not exists");
    await this.redis.clearCacheKey({key : CacheKeyEnum.SETTINGS , isPublic : true})
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.SETTINGS_UPDATE,
      referenceId: settings._id,referenceModel: ReferenceModelEnum.SETTINGS,
      metadata: {
        baseCurrencyBefore: editCurrencies.baseCurrency,baseCurrencyAfter: baseCurrency
      }
    });
    this.eventEmitter.emit('settings.base_currency.changed', {
      settingsId: settings._id,baseCurrencyBefore: editCurrencies.baseCurrency,
      baseCurrencyAfter: baseCurrency,actorId: user._id,
    });
    return editCurrencies;
  }

  async addSubCurrency({code , name}: AddSubCurrencyDTO , user : HUserDocument): Promise<ISettings> {
    const currentSettings = await this.settingsRepository.findOne({filter:{}})
    if(!currentSettings) throw new ConflictException("Settings not exists")
    if (currentSettings.baseCurrency === code) {
      throw new BadRequestException("Can't add base currency as sub currency")
    }
    const isAlreadySub = currentSettings.currencies.some(c => c.code == code)
    if(isAlreadySub) throw new ConflictException("This currency already added before")
    const exchangeRate = await this.mainSettingsService.addSubCurrency({newCurrency : code , currentSettings})
    const newCurrencyItem = {code,name,exchangeRate,updatedAt: new Date()};
    const updateSubCurrency = await this.settingsRepository.findOneAndUpdate({filter : {} , update : {$push : {currencies : newCurrencyItem} , $set : {updatedBy : user._id}},options : {returnDocument : "after"}})
    if(!updateSubCurrency) throw new NotFoundException("Fail to add subcurrency")
    await this.redis.clearCacheKey({key : CacheKeyEnum.SETTINGS , isPublic : true})
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.SETTINGS_UPDATE,
      referenceId: updateSubCurrency._id,referenceModel: ReferenceModelEnum.SETTINGS,
      metadata: {
        addedCurrencyCode: code,exchangeRateApplied: exchangeRate,subCurrencyCountAfter: updateSubCurrency.currencies.length
      }
    });
    this.eventEmitter.emit('settings.currency.added', {
      settingsId: updateSubCurrency._id,addedCurrencyCode: code,exchangeRate,actorId: user._id,
    });
    return updateSubCurrency
  }

  async removeCurrency({code} : RemoveSubCurrencyDTO , user : HUserDocument): Promise<ISettings> {
    const settings = await this.settingsRepository.findOne({filter : {"currencies.code" : code}})
    if(!settings) throw new ConflictException("This subcurrency not exists")
    const updateSubCurrency = await this.settingsRepository.findOneAndUpdate({filter : {} , update : {$pull : {currencies : {code}}},options : {returnDocument : "before"}})
    if(!updateSubCurrency) throw new NotFoundException("Fail to add subcurrency")
    await this.redis.clearCacheKey({key : CacheKeyEnum.SETTINGS , isPublic : true})
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.SETTINGS_UPDATE,
      referenceId: updateSubCurrency._id,referenceModel: ReferenceModelEnum.SETTINGS,
      metadata: {
        subCurrencyCountBefore : updateSubCurrency.currencies.length,
        baseCurrencyAfter : updateSubCurrency.currencies.length - 1
      }
    });
    this.eventEmitter.emit('settings.currency.removed', {
      settingsId: updateSubCurrency._id,removedCurrencyCode: code,actorId: user._id,
    });
    return updateSubCurrency
  }

}
